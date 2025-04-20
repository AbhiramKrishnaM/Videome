import { create } from 'zustand';
import { Meeting, CreateMeetingData, JoinMeetingData } from '@/types/meeting';
import * as meetingService from '@/services/meeting.service';

interface MeetingState {
  meetings: Meeting[];
  currentMeeting: Meeting | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchMeetings: () => Promise<void>;
  getMeeting: (id: string) => Promise<Meeting>;
  createMeeting: (data: CreateMeetingData) => Promise<Meeting>;
  joinMeeting: (data: JoinMeetingData) => Promise<Meeting>;
  deleteMeeting: (id: string) => Promise<void>;
  clearCurrentMeeting: () => void;
  clearError: () => void;
}

export const useMeetingStore = create<MeetingState>()((set, get) => ({
  meetings: [],
  currentMeeting: null,
  isLoading: false,
  error: null,

  fetchMeetings: async () => {
    try {
      set({ isLoading: true, error: null });
      const meetings = await meetingService.getMeetings();
      set({ meetings, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch meetings.';
      set({ error: errorMessage, isLoading: false });
    }
  },

  getMeeting: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const meeting = await meetingService.getMeeting(id);
      set({ currentMeeting: meeting, isLoading: false });
      return meeting;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : `Failed to fetch meeting ${id}.`;
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  createMeeting: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const meeting = await meetingService.createMeeting(data);
      set((state) => ({
        meetings: [...state.meetings, meeting],
        currentMeeting: meeting,
        isLoading: false,
      }));
      return meeting;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create meeting.';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  joinMeeting: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const meeting = await meetingService.joinMeeting(data);

      // Update the meetings array if it doesn't already include this meeting
      set((state) => {
        // Check if the meeting already exists in the state
        const meetingExists = state.meetings.some((m) => m._id === meeting._id);

        return {
          // If it doesn't exist, add it to the meetings array
          meetings: meetingExists ? state.meetings : [...state.meetings, meeting],
          currentMeeting: meeting,
          isLoading: false,
        };
      });

      return meeting;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join meeting.';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteMeeting: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await meetingService.deleteMeeting(id);
      set((state) => ({
        meetings: state.meetings.filter((meeting) => meeting._id !== id),
        currentMeeting: state.currentMeeting?._id === id ? null : state.currentMeeting,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : `Failed to delete meeting ${id}.`;
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  clearCurrentMeeting: () => {
    set({ currentMeeting: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));
