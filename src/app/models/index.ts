export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  discord?: string;
  country?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'vendedor' | 'cliente';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    bio?: string;
    avatar?: string;
    discord?: string;
    country?: string;
    phone?: string;
  };
}
