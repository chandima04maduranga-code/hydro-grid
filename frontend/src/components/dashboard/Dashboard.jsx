import React, { useState, useEffect } from "react";
import apiClient from "../../api/axiosConfig";

const Dashboard = ({ handleLogout }) => {
  const [plants, setPlants] = useState([]);
  const [sensors, setSensors] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [plantsRes, sensorsRes] = await Promise.all([
        apiClient.get("/plants"),
        apiClient.get("/sensors")
      ]);
      setPlants(plantsRes.data);
      setSensors(sensorsRes.data);
    } catch (err) {
      console.error("Dashboard sync error:", err);
      if (err.response?.status === 401) {
        handleLogout();
      }
    }
  };

  return (
    <div style={{ backgroundColor: "#f4f7f4", minHeight: "100vh", padding: "2rem", fontFamily: "sans-serif" }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        backgroundColor: "#ffffff", 
        padding: "1rem 2rem", 
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
      }}>
        <h2 style={{ color: "#1b5e20", margin: 0 }}>Hydro_Grid Control Panel — Enterprise Dashboard</h2>
        <button onClick={handleLogout} style={{ 
          padding: "0.5rem 1rem", 
          backgroundColor: "#c62828", 
          color: "white", 
          border: "none", 
          borderRadius: "6px", 
          cursor: "pointer" 
        }}>
          Logout
        </button>
      </div>

      <div style={{ display: "flex", gap: "2rem", marginTop: "2rem" }}>
        <div style={{ flex: 1, backgroundColor: "#ffffff", borderTop: "4px solid #2e7d32", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <h3 style={{ color: "#2e7d32", marginTop: 0 }}>Active Crop Systems</h3>
          {plants.length === 0 ? <p style={{ color: "#666" }}>No plants registered.</p> : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {plants.map(plant => (
                <li key={plant._id} style={{ padding: "0.75rem 0", borderBottom: "1px solid #e8f5e9" }}>
                  <strong style={{ color: "#333" }}>{plant.name}</strong> <span style={{ color: "#666" }}>({plant.species})</span> <br/>
                  <small style={{ color: "#2e7d32", fontWeight: "bold" }}>Status: {plant.healthStatus}</small>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ flex: 1, backgroundColor: "#ffffff", borderTop: "4px solid #00acc1", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <h3 style={{ color: "#00838f", marginTop: 0 }}>Hydro Telemetry Data</h3>
          {sensors.length === 0 ? <p style={{ color: "#666" }}>No telemetry active.</p> : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {sensors.map(sensor => (
                <li key={sensor._id} style={{ padding: "0.75rem 0", borderBottom: "1px solid #e0f7fa" }}>
                  <strong style={{ color: "#333" }}>{sensor.type}</strong>: <span style={{ color: "#00838f" }}>{sensor.value} {sensor.unit}</span> <br/>
                  <small style={{ color: "#555" }}>Location Node: {sensor.location}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;