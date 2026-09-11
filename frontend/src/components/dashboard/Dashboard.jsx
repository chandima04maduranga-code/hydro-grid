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
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Hydro_Grid Operator Panel — Welcome, Chandima</h2>
        <button onClick={handleLogout} style={{ padding: "0.5rem 1rem", background: "#dc3545", color: "white", border: "none", cursor: "pointer" }}>
          Logout
        </button>
      </div>

      <div style={{ display: "flex", gap: "2rem", marginTop: "2rem" }}>
        <div style={{ flex: 1, border: "1px solid #ccc", padding: "1rem", borderRadius: "8px" }}>
          <h3>System Plants</h3>
          {plants.length === 0 ? <p>No plants registered.</p> : (
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

        <div style={{ flex: 1, border: "1px solid #ccc", padding: "1rem", borderRadius: "8px" }}>
          <h3>Sensor Telemetry</h3>
          {sensors.length === 0 ? <p>No telemetry active.</p> : (
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

export default Dashboard;