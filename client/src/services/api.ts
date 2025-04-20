import axios, { AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

// Create customized error to handle API errors better
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Define error response data structure
interface ErrorResponseData {
  message?: string;
  error?: string;
  [key: string]: any;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout to prevent hanging requests
  timeout: 15000,
});

// Interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor to handle response
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error.message);
      return Promise.reject(
        new ApiError('Network error. Please check your internet connection.', 0),
      );
    }

    // Handle 401 Unauthorized errors
    if (error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Don't redirect automatically for API calls, let components handle it
    }

    // Extract error message from response if available
    const responseData = error.response.data as ErrorResponseData;
    const errorMsg =
      responseData?.message ||
      responseData?.error ||
      error.message ||
      'An unexpected error occurred';

    return Promise.reject(new ApiError(errorMsg, error.response.status, error.response.data));
  },
);

export default api;
