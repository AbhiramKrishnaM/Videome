import api from './api';
import { User, ApiResponse } from '@/types/user';

export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await api.get<ApiResponse<User[]>>('/users');
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};

export const getUser = async (id: string): Promise<User> => {
  try {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Failed to fetch user ${id}:`, error);
    throw error;
  }
};

export const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
  try {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, userData);
    return response.data.data;
  } catch (error) {
    console.error(`Failed to update user ${id}:`, error);
    throw error;
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  try {
    await api.delete(`/users/${id}`);
  } catch (error) {
    console.error(`Failed to delete user ${id}:`, error);
    throw error;
  }
};
