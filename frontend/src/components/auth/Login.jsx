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
      setError(err.response?.data?.msg || "Authentication failed.");
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2>Hydro_Grid Access Portal</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input 
          type="email" 
          placeholder="Chandima's Email / User ID" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required
          style={{ padding: "0.5rem" }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required
          style={{ padding: "0.5rem" }}
        />
        <button type="submit" style={{ padding: "0.5rem", background: "#007bff", color: "white", border: "none", cursor: "pointer" }}>
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;