import api from './api';
import { Meeting, CreateMeetingData, JoinMeetingData } from '@/types/meeting';
import { ApiResponse, User } from '@/types/user';

export const getMeetings = async (): Promise<Meeting[]> => {
  try {
    const response = await api.get<ApiResponse<Meeting[]>>('/meetings');
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch meetings:', error);
    throw error;
  }
};

export const getMeeting = async (id: string): Promise<Meeting> => {
  try {
    const response = await api.get<ApiResponse<Meeting>>(`/meetings/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Failed to fetch meeting ${id}:`, error);
    throw error;
  }
};

export const createMeeting = async (data: CreateMeetingData): Promise<Meeting> => {
  try {
    const response = await api.post<ApiResponse<Meeting>>('/meetings', data);
    return response.data.data;
  } catch (error) {
    console.error('Failed to create meeting:', error);
    throw error;
  }
};

export const updateMeeting = async (id: string, data: Partial<Meeting>): Promise<Meeting> => {
  try {
    const response = await api.put<ApiResponse<Meeting>>(`/meetings/${id}`, data);
    return response.data.data;
  } catch (error) {
    console.error(`Failed to update meeting ${id}:`, error);
    throw error;
  }
};

export const deleteMeeting = async (id: string): Promise<void> => {
  try {
    await api.delete(`/meetings/${id}`);
  } catch (error) {
    console.error(`Failed to delete meeting ${id}:`, error);
    throw error;
  }
};

export const joinMeeting = async (data: JoinMeetingData): Promise<Meeting> => {
  try {
    const response = await api.post<ApiResponse<Meeting>>(`/meetings/join/${data.meetingCode}`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to join meeting:', error);
    throw error;
  }
};

/**
 * Get organization members for meeting invites
 * Does not include the current user
 */
export const getOrganizationMembers = async (): Promise<User[]> => {
  try {
    const response = await api.get<ApiResponse<User[]>>('/meetings/organization-members');
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch organization members:', error);
    throw error;
  }
};
