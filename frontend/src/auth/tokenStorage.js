// "Keep me logged in" stores the token in localStorage (survives closing the
// browser); otherwise sessionStorage (cleared when the browser closes).
const TOKEN_KEY = "hg_token";

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage unavailable: nothing to clear
  }
};

export const saveToken = (token, remember) => {
  clearToken();
  try {
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  } catch {
    // Storage unavailable: the session lasts until the page is reloaded
  }
};
