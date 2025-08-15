// API Client for making HTTP requests to our Next.js API routes

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  total?: number;
}

class ApiClient {
  private baseUrl = '';

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const url = new URL(endpoint, window.location.origin);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value) url.searchParams.append(key, value);
        });
      }

      const response = await fetch(url.toString());
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred'
      };
    }
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred'
      };
    }
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred'
      };
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred'
      };
    }
  }
}

export const apiClient = new ApiClient();

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