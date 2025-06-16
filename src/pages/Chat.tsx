import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getCurrentUser } from '../services/authService';

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message?: string;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative;
    length: number;
    isFinal: boolean;
    item(index: number): SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
    length: number;
    item(index: number): SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

type Message = {
    id: string;
    content: string;
    sender: 'user' | 'bot';
    timestamp: Date;
};

const Chat = () => {
    const navigate = useNavigate();
    const user = getCurrentUser();
    const [messages, setMessages] = useState<Message[]>(() => {
        // Load messages from localStorage on initial render
        const savedMessages = localStorage.getItem('chatMessages');
        if (savedMessages) {
            try {
                // Parse the stored JSON and convert string timestamps back to Date objects
                const parsedMessages = JSON.parse(savedMessages);
                return parsedMessages.map((msg: any) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                }));
            } catch (e) {
                console.error('Failed to parse saved messages:', e);
                // Return default message if parsing fails
                return [
                    {
                        id: '1',
                        content: 'Hello! How can I assist you today?',
                        sender: 'bot',
                        timestamp: new Date(),
                    },
                ];
            }
        } else {
            // Default initial message if no saved messages
            return [
                {
                    id: '1',
                    content: 'Hello! How can I assist you today?',
                    sender: 'bot',
                    timestamp: new Date(),
                },
            ];
        }
    });
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [inputHistory, setInputHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isListening, setIsListening] = useState(false);
    const [darkMode, setDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    
    // Add input focused state for prompt templates
    const [inputFocused, setInputFocused] = useState(false);
    
    // Update prompt templates with more varied suggestions
    const promptTemplates = [
        "Tell me a joke",
        "What time is it?",
        "How does voice input work?",
        "Tell me about yourself",
        "What can you help me with?"
    ];

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    // Save messages to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('chatMessages', JSON.stringify(messages));
    }, [messages]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('chatMessages'); // Clear chat messages on logout
        navigate('/login');
    };

    const toggleTheme = () => {
        setDarkMode(prev => !prev);
    };

    const handleSendMessage = async () => {
        if (inputMessage.trim() === '') return;


        const userMessage: Message = {
            id: Date.now().toString(),
            content: inputMessage,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);

        setInputHistory(prev => [inputMessage, ...prev.slice(0, 9)]);
        setHistoryIndex(-1);


        const currentInput = inputMessage;
        setInputMessage('');


        setIsLoading(true);

        try {

            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));


            const input = currentInput.toLowerCase();
            let botResponse = '';


            if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
                botResponse = `Hello ${user?.username || 'there'}! How can I assist you today?`;
            }
            else if (input.includes('help')) {
                botResponse = "I can help you with various tasks. Try asking me about:\n- Chat features\n- Account information\n- How to use voice input\n- How to export chat";
            }
            else if (input.includes('weather')) {
                botResponse = "I don't have access to real-time weather data, but I can tell you that weather conditions vary by location. You might want to check a weather service like weather.com or accuweather.com for accurate forecasts.";
            }
            else if (input.includes('name')) {
                botResponse = `My name is ChatBot. I'm your virtual assistant. Nice to meet you, ${user?.username || 'there'}!`;
            }
            else if (input.includes('thank')) {
                botResponse = "You're welcome! I'm happy to help. Let me know if you need anything else.";
            }
            else if (input.includes('voice') || input.includes('speak') || input.includes('microphone')) {
                botResponse = "To use voice input, click the microphone button next to the message input. Start speaking, and your words will be converted to text. This feature requires microphone permission in your browser.";
            }
            else if (input.includes('export') || input.includes('save') || input.includes('download')) {
                botResponse = "You can export this conversation by clicking the 'Export Chat' button at the top of the screen. This will download a text file with the entire chat history.";
            }
            else if (input.includes('logout') || input.includes('sign out')) {
                botResponse = "To log out, click the red 'Logout' button in the top-right corner of the screen. This will end your session and return you to the login page.";
            }
            else if (input.includes('who are you') || input.includes('what are you')) {
                botResponse = "I'm a chat assistant created to demonstrate front-end development skills. I can respond to messages, but I'm not connected to any external API or AI service.";
            }
            else if (input.includes('time') || input.includes('date')) {
                botResponse = `The current time is ${new Date().toLocaleTimeString()} and today's date is ${new Date().toLocaleDateString()}.`;
            }
            else if (input.includes('joke') || input.includes('funny')) {
                const jokes = [
                    "Why don't scientists trust atoms? Because they make up everything!",
                    "Why did the developer go broke? Because he used up all his cache!",
                    "How do you comfort a JavaScript bug? You console it!",
                    "Why do programmers prefer dark mode? Because light attracts bugs!",
                    "What's a computer's favorite snack? Microchips!"
                ];
                botResponse = jokes[Math.floor(Math.random() * jokes.length)];
            }
            else if (input.length < 5) {
                botResponse = "Could you please provide more details so I can help you better?";
            }
            else {

                if (input.includes('?') || input.startsWith('what') || input.startsWith('how') ||
                    input.startsWith('why') || input.startsWith('when') || input.startsWith('where') ||
                    input.startsWith('who') || input.startsWith('can')) {
                    botResponse = "That's an interesting question. As a simple demo bot, I have limited knowledge. For complex questions, you might want to try a more advanced AI assistant like ChatGPT or Google Bard.";
                } else {
                    const responses = [
                        "I understand what you're saying. Can you tell me more about that?",
                        `That's interesting, ${user?.username || 'there'}. Would you like to elaborate?`,
                        "I see. Could you provide more details so I can give a better response?",
                        "Interesting point. Let me know if there's anything specific you'd like to discuss.",
                        "I appreciate you sharing that. What else would you like to chat about?"
                    ];
                    botResponse = responses[Math.floor(Math.random() * responses.length)];
                }
            }


            const botMessage: Message = {
                id: Date.now().toString(),
                content: botResponse,
                sender: 'bot',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error generating response:', error);


            const errorMessage: Message = {
                id: Date.now().toString(),
                content: "I'm sorry, I encountered an error while processing your message. Please try again.",
                sender: 'bot',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        } else if (e.key === 'ArrowUp') {

            if (historyIndex < inputHistory.length - 1) {
                const newIndex = historyIndex + 1;
                setHistoryIndex(newIndex);
                setInputMessage(inputHistory[newIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setInputMessage(inputHistory[newIndex]);
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setInputMessage('');
            }
        }
    };

    const startListening = () => {

        if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
            console.error("Speech Recognition API is not supported in this browser");
            alert('Your browser does not support Speech Recognition. Please use Chrome, Edge, or Safari.');
            return;
        }

        try {

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition: any = new SpeechRecognition();

            console.log("Speech recognition instance created:", !!recognition);

            recognition.lang = 'en-US';
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => {
                console.log("Voice recognition started successfully");
                setIsListening(true);
            };

            recognition.onresult = (event: any) => {
                try {
                    const transcript = event.results[0][0].transcript;
                    console.log("Recognized text:", transcript);
                    setInputMessage(prev => prev + transcript);
                } catch (err) {
                    console.error("Error processing speech result:", err);
                }
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error, event);
                let errorMessage = "Speech recognition error";


                switch (event.error) {
                    case 'not-allowed':
                        errorMessage = "Microphone access was denied. Please allow microphone access in your browser settings.";
                        break;
                    case 'no-speech':
                        errorMessage = "No speech was detected. Please try again and speak clearly.";
                        break;
                    case 'network':
                        errorMessage = "Network error occurred. Please check your internet connection.";
                        break;
                    default:
                        errorMessage = `Speech recognition error: ${event.error}`;
                }

                alert(errorMessage);
                setIsListening(false);
            };

            recognition.onend = () => {
                console.log("Voice recognition ended");
                setIsListening(false);
            };


            recognition.start();
            console.log("Speech recognition started");

        } catch (err) {
            console.error("Fatal error with speech recognition:", err);
            alert("Failed to initialize speech recognition. This might be due to:\n- Missing microphone permissions\n- Using an HTTP connection (try HTTPS)\n- Browser compatibility issues");
            setIsListening(false);
        }
    };


    const exportChat = () => {
        const chatContent = messages.map(msg =>
            `[${msg.timestamp.toLocaleString()}] ${msg.sender === 'user' ? user?.username || 'You' : 'Bot'}: ${msg.content}`
        ).join('\n\n');

        const blob = new Blob([chatContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-export-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderChatBubble = (message: Message) => {
        const isUser = message.sender === 'user';
        return (
            <div
                key={message.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
                {!isUser && (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold mr-2 flex-shrink-0 shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    </div>
                )}
                <div
                    className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl shadow
                        ${isUser
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-tr-none'
                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700'
                        }`}
                >
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-1.5 text-right ${isUser ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}>
                        {formatTime(message.timestamp)}
                    </p>
                </div>
                {isUser && (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold ml-2 flex-shrink-0 shadow-md">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                )}
            </div>
        );
    };

    const renderInputArea = () => {
        return (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 rounded-b-lg">
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-grow relative">
                        {/* Show prompts above input when focused */}
                        {inputFocused && !isLoading && (
                            <div className="absolute -top-12 left-0 right-0 mb-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 px-3 z-10">
                                <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 scrollbar-hide">
                                    {promptTemplates.map((prompt, index) => (
                                        <button
                                            key={index}
                                            className="px-3 py-1 text-sm bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors shadow-sm flex-shrink-0 hover:shadow-md"
                                            onClick={() => handleSelectPrompt(prompt)}
                                            onMouseDown={(e) => e.preventDefault()} // Prevent input blur
                                            disabled={isLoading}
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="flex rounded-xl border border-gray-300 dark:border-gray-600 overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-500 transition-all bg-white dark:bg-gray-900">
                            <input
                                id="chat-input"
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyDown={handleKeyPress}
                                onFocus={() => setInputFocused(true)}
                                onBlur={() => setTimeout(() => setInputFocused(false), 200)}
                                placeholder="Type your message..."
                                className="flex-grow px-4 py-3 focus:outline-none text-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 dark:bg-gray-900"
                                disabled={isLoading}
                            />
                            {renderMicrophoneButton()}
                        </div>
                    </div>
                    
                    <button
                        onClick={handleSendMessage}
                        className="sm:w-auto w-full flex-shrink-0 inline-flex justify-center items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                        disabled={isLoading || inputMessage.trim() === ''}
                    >
                        <span className="hidden sm:inline">Send</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                    Press Up/Down arrows to navigate through message history • Click the microphone icon to use voice input
                </p>
            </div>
        );
    };

    // Improved microphone button with better icons and animations
    const renderMicrophoneButton = () => {
        return (
            <button
                onClick={startListening}
                className={`px-4 border-l border-gray-300 dark:border-gray-600 text-sm font-medium transition-all
                    ${isListening 
                    ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50' 
                    : 'text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-gray-800'
                    }
                    focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-500`}
                disabled={isLoading}
                title={isListening ? "Stop listening" : "Start voice input"}
                aria-label="Voice input"
            >
                <div className="relative flex items-center justify-center">
                    {isListening ? (
                        // Active microphone with waves animation
                        <div className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 animate-pulse" viewBox="0 0 24 24" fill="none">
                                <path d="M12 15.75C13.6569 15.75 15 14.4069 15 12.75V4.5C15 2.84315 13.6569 1.5 12 1.5C10.3431 1.5 9 2.84315 9 4.5V12.75C9 14.4069 10.3431 15.75 12 15.75Z" 
                                      fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M6 11.25V12.75C6 16.0637 8.68629 18.75 12 18.75C15.3137 18.75 18 16.0637 18 12.75V11.25" 
                                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12 18.75V22.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M8.25 22.5H15.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                
                                {/* Sound wave animation */}
                                <path className="animate-ping opacity-75" d="M3 11.5C3 11.5 4.5 13 6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path className="animate-ping opacity-75" style={{ animationDelay: "0.2s" }} d="M21 11.5C21 11.5 19.5 13 18 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping"></span>
                            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                        </div>
                    ) : (
                        // Idle microphone icon
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                            <path d="M12 15.75C13.6569 15.75 15 14.4069 15 12.75V4.5C15 2.84315 13.6569 1.5 12 1.5C10.3431 1.5 9 2.84315 9 4.5V12.75C9 14.4069 10.3431 15.75 12 15.75Z" 
                                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M6 11.25V12.75C6 16.0637 8.68629 18.75 12 18.75C15.3137 18.75 18 16.0637 18 12.75V11.25" 
                                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 18.75V22.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M8.25 22.5H15.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    )}
                    
                    {/* Ripple effect when listening */}
                    {isListening && (
                        <div className="absolute inset-0 -m-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-20"></span>
                        </div>
                    )}
                </div>
            </button>
        );
    };

    // Modified handleSelectPrompt to immediately send the message after selection
    const handleSelectPrompt = (prompt: string) => {
        setInputMessage(prompt);
        setInputFocused(false);
        
        // Small timeout to ensure inputMessage is set before sending
        setTimeout(() => {
            // Focus the input after selecting a template
            const inputElement = document.getElementById('chat-input');
            if (inputElement) {
                (inputElement as HTMLInputElement).focus();
            }
            // Auto-send the message
            handleSendMessage();
        }, 10);
    };

    const renderThemeToggle = () => {
        return (
            <button
                onClick={toggleTheme}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-colors shadow-sm"
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
                {darkMode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                )}
                <span className="hidden sm:inline">{darkMode ? "Light Mode" : "Dark Mode"}</span>
            </button>
        );
    };

    const renderHeader = () => {
        return (
            <header className="bg-gradient-to-r from-indigo-600 to-blue-700 dark:from-indigo-900 dark:to-blue-900 shadow-md sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                        <div className="flex items-center">
                            <div className="h-10 w-10 rounded-lg bg-white bg-opacity-20 flex items-center justify-center text-white font-bold">
                                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                            <h1 className="ml-3 text-xl sm:text-2xl font-bold text-white">Chat Assistant</h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {renderThemeToggle()}
                            
                          
                            <button
                                onClick={clearChatHistory}
                                className="inline-flex items-center px-3 py-1.5 sm:py-2 border border-transparent text-sm font-medium rounded-lg text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors shadow-sm dark:text-yellow-200 dark:bg-yellow-900/50 dark:hover:bg-yellow-900/70"
                                title="Clear all chat messages"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span className="hidden sm:inline">Clear Chat</span>
                                <span className="sm:hidden">Clear</span>
                            </button>
                            
                            <button
                                onClick={exportChat}
                                className="inline-flex items-center px-3 py-1.5 sm:py-2 border border-transparent text-sm font-medium rounded-lg text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-200 transition-colors shadow-sm dark:text-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800"
                            >
                                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span className="hidden sm:inline">Export Chat</span>
                                <span className="sm:hidden">Export</span>
                            </button>

                            <div className="flex items-center bg-white bg-opacity-20 px-3 py-1 rounded-lg">
                                <div className="h-8 w-8 rounded-full bg-white text-indigo-600 flex items-center justify-center font-bold shadow-sm">
                                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <span className="ml-2 text-white font-medium text-sm">
                                    {user?.username || 'User'}
                                </span>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center px-3 py-1.5 sm:py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 transition-colors shadow-sm"
                            >
                                <svg className="h-4 w-4 sm:mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>
        );
    };

    const renderLoadingIndicator = () => {
        return (
            <div className="flex justify-start animate-fadeIn">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold mr-2 flex-shrink-0 shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                </div>
                <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-5 py-4 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-700 shadow flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-bounce"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
            </div>
        );
    };

    // Add a function to clear chat history
    const clearChatHistory = () => {
        if (window.confirm('Are you sure you want to clear the chat history?')) {
            setMessages([
                {
                    id: Date.now().toString(),
                    content: 'Chat history has been cleared. How can I assist you today?',
                    sender: 'bot',
                    timestamp: new Date(),
                },
            ]);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950">
            {renderHeader()}

            <main className="flex-grow flex flex-col max-w-5xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
                <div className="flex-grow flex flex-col h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)] bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="flex-grow overflow-y-auto p-3 sm:p-6 space-y-6 bg-gradient-to-b from-white dark:from-gray-800 to-gray-50 dark:to-gray-900">
                        {messages.map((message) => renderChatBubble(message))}

                        {isLoading && renderLoadingIndicator()}

                        <div ref={messagesEndRef} />
                    </div>

                    {renderInputArea()}
                </div>
            </main>
        </div>
    );
};

export default Chat;


declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}


