import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import apiClient, { setUnauthorizedHandler } from "../api/axiosConfig";
import { clearToken, getToken, saveToken } from "../auth/tokenStorage";
import { AuthContext } from "./AuthContext";

// status: "checking" (validating a saved token) | "authenticated" | "guest"
const AuthProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(() => (getToken() ? "checking" : "guest"));
  const [sessionExpired, setSessionExpired] = useState(false);

  const endSession = useCallback(() => {
    clearToken();
    setUser(null);
    setStatus("guest");
  }, []);

  const startSession = useCallback((sessionUser) => {
    setUser(sessionUser);
    setStatus("authenticated");
    setSessionExpired(false);
    if (sessionUser.preferredLanguage && sessionUser.preferredLanguage !== i18n.language) {
      i18n.changeLanguage(sessionUser.preferredLanguage);
    }
  }, [i18n]);

  // Server rejected the token (expired, or the account was disabled)
  useEffect(() => {
    setUnauthorizedHandler(() => {
      endSession();
      setSessionExpired(true);
    });
    return () => setUnauthorizedHandler(null);
  }, [endSession]);

  // Restore a saved session on page load
  useEffect(() => {
    if (!getToken()) return;
    apiClient.get("/auth/me")
      .then(({ data }) => startSession(data.user))
      .catch(() => endSession());
  }, [startSession, endSession]);

  const login = useCallback(async (companyId, email, password, remember) => {
    const { data } = await apiClient.post("/auth/login", { companyId, email, password });
    saveToken(data.token, remember);
    startSession(data.user);
    return data.user;
  }, [startSession]);

  const register = useCallback(async (details) => {
    const { data } = await apiClient.post("/auth/register", details);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setSessionExpired(false);
    endSession();
  }, [endSession]);

  // Switch the UI language and remember it on the user's profile
  const changeLanguage = useCallback((language) => {
    i18n.changeLanguage(language);
    if (status !== "authenticated") return;
    apiClient.patch("/auth/me", { preferredLanguage: language })
      .then(({ data }) => setUser(data.user))
      .catch(() => {
        // The UI already switched; the preference will be saved next time
      });
  }, [i18n, status]);

  const value = useMemo(() => ({
    user,
    status,
    sessionExpired,
    login,
    register,
    logout,
    changeLanguage
  }), [user, status, sessionExpired, login, register, logout, changeLanguage]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
