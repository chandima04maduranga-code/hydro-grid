import React, { useState } from "react";
import Login from "./components/auth/Login";
import Dashboard from "./components/dashboard/Dashboard";

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  const handleLogout = () => {
    setToken("");
    localStorage.removeItem("token");
  };

  return (
    <div>
      {!token ? (
        <Login setAuth={setToken} />
      ) : (
        <Dashboard handleLogout={handleLogout} />
      )}
    </div>
  );
};

export default App;