// API Client for making HTTP requests to our Next.js API routes
import { getBaseUrl } from './utils';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  total?: number;
}

class ApiClient {
  private makeUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>) {
    const url = new URL(endpoint, getBaseUrl());
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null || v === '') continue;
        url.searchParams.set(k, String(v));
      }
    }
    return url.toString();
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(this.makeUrl(endpoint, params), {
        cache: 'no-store',
      });
      return await response.json();
    } catch {
      return { success: false, error: 'Network error occurred' };
    }
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(this.makeUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch {
      return { success: false, error: 'Network error occurred' };
    }
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(this.makeUrl(endpoint), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch {
      return { success: false, error: 'Network error occurred' };
    }
  }

  async patch<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(this.makeUrl(endpoint), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch {
      return { success: false, error: 'Network error occurred' };
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(this.makeUrl(endpoint), {
        method: 'DELETE',
      });
      return await response.json();
    } catch {
      return { success: false, error: 'Network error occurred' };
    }
  }
}

export const apiClient = new ApiClient();

/* ---------- โครงสร้างเดิมทั้งหมด พร้อม getAll ฯลฯ ---------- */

// Hardware Assets API
export const hardwareApi = {
  getAll: (filters?: { search?: string; status?: string; type?: string }) =>
    apiClient.get('/api/assets', filters),
  getById: (id: string) =>
    apiClient.get(`/api/assets/${id}`),
  create: (data: any) =>
    apiClient.post('/api/assets', data),
  update: (id: string, data: any) =>
    apiClient.put(`/api/assets/${id}`, data),
  delete: (id: string) =>
    apiClient.delete(`/api/assets/${id}`),
};

// Users API
export const usersApi = {
  getAll: (filters?: { search?: string; status?: string; department?: string }) =>
    apiClient.get('/api/users', filters),
  getById: (id: string) =>
    apiClient.get(`/api/users/${id}`),
  create: (data: any) =>
    apiClient.post('/api/users', data),
  update: (id: string, data: any) =>
    apiClient.put(`/api/users/${id}`, data),
  delete: (id: string) =>
    apiClient.delete(`/api/users/${id}`),
};

// Software API
export const softwareApi = {
  getAll: (filters?: { search?: string; status?: string; type?: string }) =>
    apiClient.get('/api/software', filters),
  getById: (id: string) =>
    apiClient.get(`/api/software/${id}`),
  create: (data: any) =>
    apiClient.post('/api/software', data),
  update: (id: string, data: any) =>
    apiClient.put(`/api/software/${id}`, data),
  delete: (id: string) =>
    apiClient.delete(`/api/software/${id}`),
};

// Borrowing API
export const borrowingApi = {
  getAll: (filters?: { status?: string; userId?: string; assetId?: string }) =>
    apiClient.get('/api/borrowing', filters),
  getById: (id: string) =>
    apiClient.get(`/api/borrowing/${id}`),
  checkout: (data: any) =>
    apiClient.post('/api/borrowing', data),
  checkin: (id: string, data?: any) =>
    apiClient.put(`/api/borrowing/${id}`, { ...data, action: 'checkin' }),
  update: (id: string, data: any) =>
    apiClient.put(`/api/borrowing/${id}`, data),
  delete: (id: string) =>
    apiClient.delete(`/api/borrowing/${id}`),
};

// Patches API
export const patchesApi = {
  getAll: (filters?: { status?: string; assetId?: string; critical?: string }) =>
    apiClient.get('/api/patches', filters),
  getById: (id: string) =>
    apiClient.get(`/api/patches/${id}`),
  create: (data: any) =>
    apiClient.post('/api/patches', data),
  update: (id: string, data: any) =>
    apiClient.put(`/api/patches/${id}`, data),
  delete: (id: string) =>
    apiClient.delete(`/api/patches/${id}`),
  runPatchCheck: (assetId: string) =>
    apiClient.post('/api/patches', { assetId, action: 'check' }),
};
