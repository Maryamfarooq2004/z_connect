import axios from "axios";

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

// Interceptor to attach access token from localStorage (safe for client-side execution)
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("zconnect_access_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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
          const refreshToken = localStorage.getItem("zconnect_refresh_token");
          
          if (refreshToken) {
            // Attempt to refresh token using the base client to avoid interceptor loop
            const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
              refreshToken,
            });
            
            if (response.data?.accessToken) {
              localStorage.setItem("zconnect_access_token", response.data.accessToken);
              if (response.data.refreshToken) {
                localStorage.setItem("zconnect_refresh_token", response.data.refreshToken);
              }
              
              // Retry the original request with the new token
              originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
              return apiClient(originalRequest);
            }
          }
        }
      } catch (refreshError) {
        // Refresh token failed, clear credentials and redirect to login
        if (typeof window !== "undefined") {
          localStorage.removeItem("zconnect_access_token");
          localStorage.removeItem("zconnect_refresh_token");
          // Dispatch a custom event to notify components/auth providers
          window.dispatchEvent(new Event("auth_session_expired"));
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
