import api from './api';
import { User } from '@/types/user';

// Use the same mock mode as auth service
const MOCK_MODE = false; // Set to false when backend is ready
const MOCK_DELAY = 500; // Simulated server delay

// Get mockUsers from localStorage in development mode
const getMockUsers = (): User[] => {
  // Get admin user from localStorage
  const currentUser = localStorage.getItem('user');

  if (!currentUser) return [];

  const parsedUser = JSON.parse(currentUser) as User;

  // Only return mock users if the current user is an admin
  if (parsedUser.role !== 'admin') return [];

  // Generate 10 mock users
  return Array.from({ length: 10 }, (_, i) => {
    const id = (i + 1).toString();
    const isAdmin = i === 0; // First user is admin

    return {
      id,
      name: isAdmin ? 'Admin User' : `User ${id}`,
      email: isAdmin ? 'admin@example.com' : `user${id}@example.com`,
      role: isAdmin ? 'admin' : 'user',
      createdAt: new Date(Date.now() - i * 86400000).toISOString(), // Each user created a day apart
    };
  });
};

export const getUsers = async (): Promise<User[]> => {
  try {
    if (MOCK_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(getMockUsers());
        }, MOCK_DELAY);
      });
    }

    const response = await api.get<User[]>('/users');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};

export const getUser = async (id: string): Promise<User> => {
  try {
    if (MOCK_MODE) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const users = getMockUsers();
          const user = users.find((u) => u.id === id);

          if (user) {
            resolve(user);
          } else {
            reject(new Error('User not found'));
          }
        }, MOCK_DELAY);
      });
    }

    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch user ${id}:`, error);
    throw error;
  }
};

export const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
  try {
    if (MOCK_MODE) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const users = getMockUsers();
          const userIndex = users.findIndex((u) => u.id === id);

          if (userIndex !== -1) {
            const updatedUser = { ...users[userIndex], ...userData };
            users[userIndex] = updatedUser;
            resolve(updatedUser);
          } else {
            reject(new Error('User not found'));
          }
        }, MOCK_DELAY);
      });
    }

    const response = await api.put<User>(`/users/${id}`, userData);
    return response.data;
  } catch (error) {
    console.error(`Failed to update user ${id}:`, error);
    throw error;
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  try {
    if (MOCK_MODE) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const users = getMockUsers();
          const userIndex = users.findIndex((u) => u.id === id);

          if (userIndex !== -1) {
            // In a real app, we would remove the user, but for mock data
            // we don't need to modify the array since it's regenerated each time
            resolve();
          } else {
            reject(new Error('User not found'));
          }
        }, MOCK_DELAY);
      });
    }

    await api.delete(`/users/${id}`);
  } catch (error) {
    console.error(`Failed to delete user ${id}:`, error);
    throw error;
  }
};
