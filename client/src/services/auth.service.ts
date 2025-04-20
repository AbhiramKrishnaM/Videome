import api from './api';
import { AuthResponse, LoginCredentials, RegisterData, User } from '@/types/user';

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    const authResponse = response.data;

    // Store token and user in localStorage
    localStorage.setItem('token', authResponse.token);
    localStorage.setItem('user', JSON.stringify(authResponse.user));

    return authResponse;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/register', data);
    const authResponse = response.data;

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
    await api.post('/auth/logout');
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
