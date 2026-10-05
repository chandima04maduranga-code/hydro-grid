import React, { useState } from "react";
import apiClient from "../../api/axiosConfig";

const Login = ({ setToken }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await apiClient.post("/auth", { email, password });
      const receivedToken = res.data.token;
      setToken(receivedToken);
      localStorage.setItem("token", receivedToken);
    } catch (err) {
      setError(err.response?.data?.msg || "Authentication failed. Please verify credentials.");
    }
  };

  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      height: "100vh", 
      backgroundColor: "#f4f7f4", 
      fontFamily: "sans-serif" 
    }}>
      <div style={{ 
        padding: "2.5rem", 
        maxWidth: "400px", 
        width: "100%", 
        backgroundColor: "#ffffff", 
        borderRadius: "12px", 
        boxShadow: "0 4px 12px rgba(46, 125, 50, 0.1)",
        borderTop: "4px solid #2e7d32" 
      }}>
        <h2 style={{ color: "#1b5e20", marginBottom: "1.5rem", textAlign: "center" }}>Hydro_Grid Access Portal</h2>
        {error && <p style={{ color: "#c62828", fontSize: "0.9rem", marginBottom: "1rem" }}>{error}</p>}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <input 
            type="email" 
            placeholder="Enter your email address" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required
            style={{ padding: "0.75rem", borderRadius: "6px", border: "1px solid #c8e6c9", outline: "none" }}
          />
          <input 
            type="password" 
            placeholder="Enter your password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required
            style={{ padding: "0.75rem", borderRadius: "6px", border: "1px solid #c8e6c9", outline: "none" }}
          />
          <button type="submit" style={{ 
            padding: "0.75rem", 
            backgroundColor: "#2e7d32", 
            color: "white", 
            border: "none", 
            borderRadius: "6px", 
            fontWeight: "bold",
            cursor: "pointer" 
          }}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;