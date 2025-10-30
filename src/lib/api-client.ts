import { getSession } from 'next-auth/react';

// API Response wrapper for consistent error handling
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  error?: string;
  status: number;
}

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Request options
export interface RequestOptions {
  method?: HttpMethod;
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  requireAuth?: boolean;
}

// API Error class for better error handling
export class ApiError extends Error {
  public status: number;
  public data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor() {
    // Use relative URLs for client-side requests (Next.js will handle the base URL)
    this.baseUrl = '';
    this.defaultTimeout = 10000; // 10 seconds
  }

  /**
   * Get authentication headers if user is logged in
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const session = await getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (session?.user?.email) {
      // Add any authentication headers here if needed
      // For NextAuth.js, cookies are automatically included in requests
    }

    return headers;
  }

  /**
   * Make an HTTP request with automatic authentication and error handling
   */
  private async makeRequest<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      body,
      headers = {},
      timeout = this.defaultTimeout,
      requireAuth = true,
    } = options;

    try {
      // Get authentication headers if required
      const authHeaders = requireAuth ? await this.getAuthHeaders() : {};

      // Prepare request configuration
      const requestConfig: {
        method: string;
        headers: Record<string, string>;
        signal?: AbortSignal;
        body?: string | FormData;
      } = {
        method,
        headers: {
          ...authHeaders,
          ...headers,
        },
        signal: AbortSignal.timeout(timeout),
      };

      // Add body for non-GET requests
      if (body && method !== 'GET') {
        if (body instanceof FormData) {
          // Remove Content-Type header for FormData (browser will set it with boundary)
          delete (requestConfig.headers as any)['Content-Type'];
          requestConfig.body = body;
        } else {
          requestConfig.body = JSON.stringify(body);
        }
      }

      // Make the request
      const response = await fetch(`${this.baseUrl}${endpoint}`, requestConfig);

      // Parse response
      let data: T;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        // For non-JSON responses (like file downloads), return the response as data
        data = response as unknown as T;
      }

      // Handle HTTP errors
      if (!response.ok) {
        const errorMessage =
          (data as any)?.error ||
          (data as any)?.message ||
          `HTTP ${response.status}: ${response.statusText}`;

        throw new ApiError(errorMessage, response.status, data);
      }

      return {
        data,
        success: true,
        status: response.status,
      };
    } catch (error) {
      // Handle different types of errors
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }

      // Network or other errors
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new ApiError(errorMessage, 0);
    }
  }

  // Convenience methods for different HTTP verbs
  async get<T = any>(
    endpoint: string,
    options?: Omit<RequestOptions, 'method'>
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async delete<T = any>(
    endpoint: string,
    options?: Omit<RequestOptions, 'method'>
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async patch<T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PATCH', body });
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Convenience functions for common API calls
export const api = {
  // Playlist APIs
  playlists: {
    getTopTen: () => apiClient.get('/api/playlists/top-ten'),
    getProvince: () => apiClient.get('/api/playlists/province'),
    getGenre: () => apiClient.get('/api/playlists/genre'),
    getFeatured: () => apiClient.get('/api/playlists/featured'),
    getAvailable: (type?: string) =>
      apiClient.get(`/api/playlists/available${type ? `?type=${type}` : ''}`),
    getTracks: (id: string) => apiClient.get(`/api/playlists/${id}/tracks`),
    getSubmissions: () => apiClient.get('/api/playlists/submissions'),
    submitTracks: (
      playlistId: string,
      data: { trackIds: string[]; message?: string }
    ) => apiClient.post(`/api/playlists/${playlistId}/submit`, data),
  },

  // Admin APIs
  admin: {
    // Playlist Types
    getPlaylistTypes: () => apiClient.get('/api/admin/playlist-types'),
    createPlaylistType: (data: any) =>
      apiClient.post('/api/admin/playlist-types', data),
    updatePlaylistType: (id: string, data: any) =>
      apiClient.put(`/api/admin/playlist-types/${id}`, data),
    deletePlaylistType: (id: string) =>
      apiClient.delete(`/api/admin/playlist-types/${id}`),

    // Dynamic Playlists
    getPlaylists: () => apiClient.get('/api/admin/playlists-dynamic'),
    createPlaylist: (data: any) =>
      apiClient.post('/api/admin/playlists-dynamic', data),
    updatePlaylist: (id: string, data: any) =>
      apiClient.put(`/api/admin/playlists-dynamic/${id}`, data),
    deletePlaylist: (id: string) =>
      apiClient.delete(`/api/admin/playlists-dynamic/${id}`),

    // Submissions
    getSubmissions: () => apiClient.get('/api/admin/submissions'),
    reviewSubmission: (id: string, data: any) =>
      apiClient.patch(`/api/admin/submissions/${id}/review`, data),

    // Playlist Track Management
    addTracksToPlaylist: (playlistId: string, trackIds: string[]) =>
      apiClient.post(`/api/admin/playlists/${playlistId}/tracks`, { trackIds }),
    removeTracksFromPlaylist: (playlistId: string, trackIds: string[]) =>
      apiClient.delete(`/api/admin/playlists/${playlistId}/tracks`, {
        body: { trackIds },
      }),
  },

  // Track APIs
  tracks: {
    getAll: () => apiClient.get('/api/tracks'),
    delete: (id: string) => apiClient.delete(`/api/tracks/delete?id=${id}`),
    update: (data: any) => apiClient.put('/api/tracks/update', data),
  },

  // Admin Track APIs
  adminTracks: {
    getAll: () => apiClient.get('/api/admin/tracks'),
  },

  // Upload APIs
  upload: {
    image: (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return apiClient.post('/api/upload/image', formData, {
        headers: {}, // Let browser set Content-Type for FormData
      });
    },
  },

  // Auth APIs
  auth: {
    refresh: () => apiClient.post('/api/auth/refresh'),
  },
};

export default apiClient;
