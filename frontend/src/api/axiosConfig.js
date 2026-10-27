import axios from "axios";

// The session lives in an httpOnly cookie set by the server, so page scripts
// never see the login token; the browser attaches the cookie to API calls.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

// The auth layer registers a handler to react when the server rejects the session
let unauthorizedHandler = null;
export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

// A 401 from these just means "not logged in", not "your session expired"
const PUBLIC_AUTH_ROUTES = ["/auth/login", "/auth/register", "/auth/me"];

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
