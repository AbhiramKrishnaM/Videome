import api from './api';
import { Meeting, CreateMeetingData, JoinMeetingData } from '@/types/meeting';
import { ApiResponse } from '@/types/user';

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
