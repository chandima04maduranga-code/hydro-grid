import React, { useState, useEffect } from "react";
import axios from "axios";

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plants, setPlants] = useState([]);
  const [sensors, setSensors] = useState([]);

  // Fetch data when token changes (user logs in)
  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      // Setup the authorization header
      const config = {
        headers: { "x-auth-token": token }
      };

      // Fetch plants and sensors concurrently
      const [plantsRes, sensorsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/plants", config),
        axios.get("http://localhost:5000/api/sensors", config)
      ]);

      setPlants(plantsRes.data);
      setSensors(sensorsRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
      if (err.response?.status === 401) {
        handleLogout(); // Token expired or invalid
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // In a real app, you would hit a login route. 
      // Assuming your backend /api/auth returns a token for valid users.
      const res = await axios.post("http://localhost:5000/api/auth", {
        email,
        password
      });
      
      const receivedToken = res.data.token;
      setToken(receivedToken);
      localStorage.setItem("token", receivedToken);
    } catch (err) {
      console.error("Login failed:", err.response?.data?.msg || err.message);
      alert("Login Failed. Please check console or register a user first.");
    }
  };

  const handleLogout = () => {
    setToken("");
    localStorage.removeItem("token");
    setPlants([]);
    setSensors([]);
  };

  // --- RENDER LOGIN SCREEN ---
  if (!token) {
    return (
      <div style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto", fontFamily: "sans-serif" }}>
        <h2>Hydro_Grid Login</h2>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input 
            type="email" 
            placeholder="Email" 
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
  }

  // --- RENDER DASHBOARD ---
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Hydro_Grid Dashboard</h2>
        <button onClick={handleLogout} style={{ padding: "0.5rem 1rem", background: "#dc3545", color: "white", border: "none", cursor: "pointer" }}>
          Logout
        </button>
      </div>

      <div style={{ display: "flex", gap: "2rem", marginTop: "2rem" }}>
        {/* Plants Section */}
        <div style={{ flex: 1, border: "1px solid #ccc", padding: "1rem", borderRadius: "8px" }}>
          <h3>Active Plants</h3>
          {plants.length === 0 ? (
            <p>No plants found.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {plants.map(plant => (
                <li key={plant._id} style={{ padding: "0.5rem 0", borderBottom: "1px solid #eee" }}>
                  <strong>{plant.name}</strong> - {plant.species} <br/>
                  <small>Status: {plant.healthStatus}</small>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sensors Section */}
        <div style={{ flex: 1, border: "1px solid #ccc", padding: "1rem", borderRadius: "8px" }}>
          <h3>Sensor Data</h3>
          {sensors.length === 0 ? (
            <p>No sensors connected.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {sensors.map(sensor => (
                <li key={sensor._id} style={{ padding: "0.5rem 0", borderBottom: "1px solid #eee" }}>
                  <strong>{sensor.type}</strong>: {sensor.value} {sensor.unit} <br/>
                  <small>Location: {sensor.location}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;