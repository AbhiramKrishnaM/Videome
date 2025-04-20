import api, { ApiError } from './api';
import { AuthResponse, LoginCredentials, RegisterData, User } from '@/types/user';

// Mock data for development - remove in production
const MOCK_MODE = false; // Set to false when backend is ready
const MOCK_DELAY = 500; // Simulated server delay

const mockUsers = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123', // Never store plaintext passwords in a real app
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Regular User',
    email: 'user@example.com',
    password: 'password123',
    role: 'user',
    createdAt: new Date().toISOString(),
  },
];

// Helper function for mock authentication
const mockAuth = (email: string, password: string): Promise<AuthResponse> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockUsers.find((u) => u.email === email && u.password === password);

      if (user) {
        const { password, ...safeUser } = user;
        resolve({
          user: safeUser as User,
          token: `mock-jwt-token-${safeUser.id}`,
        });
      } else {
        reject(new ApiError('Invalid credentials', 401));
      }
    }, MOCK_DELAY);
  });
};

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    let authResponse: AuthResponse;

    if (MOCK_MODE) {
      authResponse = await mockAuth(credentials.email, credentials.password);
    } else {
      try {
        const response = await api.post<AuthResponse>('/auth/login', credentials);
        authResponse = response.data;
      } catch (error) {
        console.error('API login error:', error);
        if (error instanceof ApiError) {
          throw error;
        } else {
          throw new ApiError('Authentication failed', 401);
        }
      }
    }

    // Only store token and user if we successfully got a response
    localStorage.setItem('token', authResponse.token);
    localStorage.setItem('user', JSON.stringify(authResponse.user));

    return authResponse;
  } catch (error) {
    console.error('Login error:', error);
    // Rethrow to allow the component to handle it
    throw error;
  }
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    let authResponse: AuthResponse;

    if (MOCK_MODE) {
      // Create a new mock user
      const newUser = {
        id: `${mockUsers.length + 1}`,
        name: data.name,
        email: data.email,
        password: data.password,
        role: 'user', // Default role
        createdAt: new Date().toISOString(),
      };

      // Check if email already exists
      if (mockUsers.some((u) => u.email === data.email)) {
        throw new ApiError('Email already in use', 409);
      }

      mockUsers.push(newUser);
      const { password, ...safeUser } = newUser;

      authResponse = {
        user: safeUser as User,
        token: `mock-jwt-token-${safeUser.id}`,
      };
    } else {
      try {
        const response = await api.post<AuthResponse>('/auth/register', data);
        authResponse = response.data;
      } catch (error) {
        console.error('API register error:', error);
        if (error instanceof ApiError) {
          throw error;
        } else {
          throw new ApiError('Registration failed', 400);
        }
      }
    }

    // Store token and user in localStorage
    localStorage.setItem('token', authResponse.token);
    localStorage.setItem('user', JSON.stringify(authResponse.user));

    return authResponse;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    if (!MOCK_MODE) {
      await api.post('/auth/logout');
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Remove token and user from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr) as User;
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return null;
  }
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem('token');
};

export const isAuthenticated = (): boolean => {
  return !!getStoredToken();
};

export const isAdmin = (): boolean => {
  const user = getStoredUser();
  return !!user && user.role === 'admin';
};
