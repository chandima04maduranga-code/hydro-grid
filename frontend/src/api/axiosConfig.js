import axios from "axios";
import { getToken } from "../auth/tokenStorage";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// The auth layer registers a handler to react when the server rejects the session
let unauthorizedHandler = null;
export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

const PUBLIC_AUTH_ROUTES = ["/auth/login", "/auth/register"];

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isPublicAuthRoute = PUBLIC_AUTH_ROUTES.includes(error.config?.url);
    if (error.response?.status === 401 && !isPublicAuthRoute && unauthorizedHandler) {
      unauthorizedHandler();
    }
    return Promise.reject(error);
  }
);

// Maps a failed request to a translation key under "errors."
export const getErrorCode = (error) => {
  if (!error.response) return "NETWORK";
  return error.response.data?.code || "default";
};

export default apiClient;
