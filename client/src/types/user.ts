export type UserRole = 'user' | 'org_admin' | 'super_admin';

export interface Organization {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  organization?: Organization;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  organizationName?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  count: number;
  data: T;
}
