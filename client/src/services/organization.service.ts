import api from './api';

export interface Organization {
  _id: string;
  name: string;
  description?: string;
  industry?: string;
  size?: string;
  website?: string;
  logo?: string;
}

/**
 * Fetch all organizations from the public API
 * This endpoint doesn't require authentication
 */
export const getPublicOrganizations = async (): Promise<Organization[]> => {
  try {
    const response = await api.get<{ success: boolean; data: Organization[] }>(
      '/organizations/public',
    );

    if (!response.data.success) {
      throw new Error('Failed to fetch organizations');
    }

    return response.data.data;
  } catch (error) {
    console.error('Error fetching organizations:', error);
    throw error;
  }
};

/**
 * Get a single organization by ID
 * This requires authentication and proper permissions
 */
export const getOrganization = async (id: string): Promise<Organization> => {
  try {
    const response = await api.get<{ success: boolean; data: Organization }>(
      `/organizations/${id}`,
    );

    if (!response.data.success) {
      throw new Error('Failed to fetch organization');
    }

    return response.data.data;
  } catch (error) {
    console.error(`Error fetching organization ${id}:`, error);
    throw error;
  }
};
