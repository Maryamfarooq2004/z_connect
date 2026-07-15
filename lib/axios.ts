import axios from "axios";

let inMemoryAccessToken: string | null = null;

export const setInMemoryToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getInMemoryToken = () => {
  return inMemoryAccessToken;
};

const getApiBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url || url === "undefined" || url === "null" || url === "") {
    return "";
  }
  return url;
};

const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Interceptor to attach access token from memory (highly secure, safe from XSS)
apiClient.interceptors.request.use(
  (config) => {
    const token = inMemoryAccessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor for handling token refresh or unauthorized responses
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If we receive a 401 Unauthorized and haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        if (typeof window !== "undefined") {
          // Attempt to refresh token by hitting /refresh endpoint.
          // Since the browser automatically attaches the HttpOnly cookie, we don't pass the refresh token in the body.
          const response = await axios.post(
            `${API_BASE_URL}/api/auth/refresh`,
            {},
            { withCredentials: true }
          );
          
          if (response.data?.accessToken) {
            inMemoryAccessToken = response.data.accessToken;
            
            // Retry the original request with the new token
            originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh token failed/expired, clear in-memory credentials and redirect to login
        if (typeof window !== "undefined") {
          inMemoryAccessToken = null;
          // Dispatch a custom event to notify components/auth providers
          window.dispatchEvent(new Event("auth_session_expired"));
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
