import { create } from 'zustand';
import { User } from '@/types/user';
import * as usersService from '@/services/users.service';

interface UsersState {
  users: User[];
  selectedUser: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchUsers: () => Promise<void>;
  fetchUser: (id: string) => Promise<void>;
  updateUser: (id: string, userData: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  clearSelectedUser: () => void;
  clearError: () => void;
}

export const useUsersStore = create<UsersState>()((set, get) => ({
  users: [],
  selectedUser: null,
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    try {
      set({ isLoading: true, error: null });
      const users = await usersService.getUsers();
      set({ users, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users.';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchUser: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const user = await usersService.getUser(id);
      set({ selectedUser: user, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user.';
      set({ error: errorMessage, isLoading: false });
    }
  },

  updateUser: async (id, userData) => {
    try {
      set({ isLoading: true, error: null });
      const updatedUser = await usersService.updateUser(id, userData);

      // Update users list
      const users = get().users.map((user) => (user._id === id ? updatedUser : user));

      set({
        users,
        selectedUser: updatedUser,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user.';
      set({ error: errorMessage, isLoading: false });
    }
  },

  deleteUser: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await usersService.deleteUser(id);

      // Remove user from list
      const users = get().users.filter((user) => user._id !== id);

      set({
        users,
        selectedUser: get().selectedUser?._id === id ? null : get().selectedUser,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user.';
      set({ error: errorMessage, isLoading: false });
    }
  },

  clearSelectedUser: () => set({ selectedUser: null }),
  clearError: () => set({ error: null }),
}));
