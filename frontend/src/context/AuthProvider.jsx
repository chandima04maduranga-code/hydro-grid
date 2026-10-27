import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import apiClient, { setUnauthorizedHandler } from "../api/axiosConfig";
import { AuthContext } from "./AuthContext";

// status: "checking" (asking the server about the session cookie) | "authenticated" | "guest"
const AuthProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("checking");
  const [sessionExpired, setSessionExpired] = useState(false);

  const endSession = useCallback(() => {
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

  // Restore the session on page load (the cookie, if any, is sent automatically)
  useEffect(() => {
    apiClient.get("/auth/me")
      .then(({ data }) => startSession(data.user))
      .catch(() => endSession());
  }, [startSession, endSession]);

  const login = useCallback(async (companyId, email, password, remember) => {
    const { data } = await apiClient.post("/auth/login", { companyId, email, password, remember });
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
    // Clears the httpOnly cookie, which page scripts cannot remove themselves
    apiClient.post("/auth/logout").catch(() => {});
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

  // Save own name, phone or language; the server validates and returns the user
  const updateProfile = useCallback(async (fields) => {
    const { data } = await apiClient.patch("/auth/me", fields);
    setUser(data.user);
    if (data.user.preferredLanguage !== i18n.language) i18n.changeLanguage(data.user.preferredLanguage);
    return data.user;
  }, [i18n]);

  const value = useMemo(() => ({
    user,
    status,
    sessionExpired,
    login,
    register,
    logout,
    changeLanguage,
    updateProfile
  }), [user, status, sessionExpired, login, register, logout, changeLanguage, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
