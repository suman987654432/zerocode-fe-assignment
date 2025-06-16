
const API_URL = 'http://localhost:8000/api';

type RegisterData = {
  username: string;
  email: string;
  password: string;
};

type LoginData = {
  email: string;
  password: string;
};

type AuthResponse = {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
};

export const loginUser = async (data: LoginData): Promise<AuthResponse> => {
  return new Promise<AuthResponse>((resolve, reject) => {
    setTimeout(() => {
      
      if (data.email && data.password) {
      
        const registeredUserJSON = localStorage.getItem('registeredUser');
        let username = data.email.split('@')[0]; 
        if (registeredUserJSON) {
          try {
            const registeredUser = JSON.parse(registeredUserJSON);
            if (registeredUser.email === data.email) {
              username = registeredUser.username;
            }
          } catch (err) {
            console.error("Error parsing registered user data:", err);
          }
        }
        
        const user = {
          id: 'user-123',
          username: username,
          email: data.email
        };
        
        resolve({
          token: 'simulated-jwt-token-123456',
          user: user
        });
      } else {
        reject(new Error('Email and password are required'));
      }
    }, 500);
  });
};

export const registerUser = async (data: RegisterData): Promise<AuthResponse> => {
  return new Promise<AuthResponse>((resolve) => {
    setTimeout(() => {
  
      const user = {
        id: 'user-' + Math.floor(Math.random() * 10000),
        username: data.username, 
        email: data.email
      };
      
     
      localStorage.setItem('registeredUser', JSON.stringify(user));
      
      resolve({
        token: 'simulated-jwt-token-123456',
        user
      });
    }, 500);
  });
};

export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  return !!token;
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

export const getCurrentUser = (): any => {
  const userString = localStorage.getItem('user');
  return userString ? JSON.parse(userString) : null;
};
