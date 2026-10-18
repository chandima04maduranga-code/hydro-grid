import React, { useState, useEffect } from "react";
import apiClient from "../../api/axiosConfig";
import { Leaf, LogOut, Bell, Droplets, Thermometer } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const Dashboard = ({ handleLogout }) => {
  const [plants, setPlants] = useState([]);
  const [sensors, setSensors] = useState([]);

  // Mock chart data for the UI
  const mockChartData = [{ value: 40 }, { value: 42 }, { value: 44.4 }, { value: 43 }, { value: 45 }];

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(), 3000);
    return () => clearInterval(interval);
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
      if (err.response?.status === 401) handleLogout();
    }
  };

  return (
    <div className="min-h-screen bg-green-50 p-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Leaf className="text-hydroGreen w-8 h-8"/>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Hydro_Grid</h2>
            <p className="text-xs text-gray-500">Smart Hydroponic Management</p>
          </div>
        </div>
        <div className="text-center hidden md:block">
          <h3 className="text-lg font-bold">Control Panel — Enterprise Dashboard</h3>
          <p className="text-xs text-gray-500">Monitor • Manage • Grow Smarter</p>
        </div>
        <div className="flex items-center gap-4">
          <Bell className="text-gray-400 cursor-pointer hover:text-hydroGreen"/>
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors">
            <LogOut h-4 w-4/> Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Active Crop Systems */}
        <div className="bg-white rounded-xl shadow-sm border-t-4 border-hydroGreen p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="bg-green-100 p-2 rounded-full"><Leaf className="text-hydroGreen w-5 h-5"/></div>
              <h3 className="text-xl font-bold text-gray-800">Active Crop Systems</h3>
            </div>
            <span className="bg-hydroLightGreen text-hydroGreen px-3 py-1 rounded-full text-sm font-bold">{plants.length} Systems</span>
          </div>

          <div className="space-y-4">
            {plants.length === 0 ? <p className="text-gray-500">No plants registered.</p> : plants.map((plant) => (
              <div key={plant._id} className="border border-gray-100 rounded-lg p-4 flex gap-4 hover:shadow-md transition-shadow">
                
                {/* Plant Image dynamically rendered from MongoDB URL */}
                <div className="w-32 h-24 rounded-lg flex-shrink-0 overflow-hidden shadow-sm">
                  <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />
                </div> 

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{plant.name}</h4>
                      <p className="text-sm text-gray-500 italic">{plant.species}</p>
                    </div>
                    {/* Dynamic Status Badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${plant.healthStatus === 'Healthy' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {plant.healthStatus === 'Nutrient Warning' ? '⚠️ ' : '● '}{plant.healthStatus}
                    </span>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <p>🌱 Crop Type: <span className="font-medium">{plant.cropType}</span></p>
                    <p>💧 System ID: <span className="font-medium">{plant.systemId}</span></p>
                    <p>📅 Growth Stage: <span className="font-medium">{plant.growthStage}</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Telemetry Data */}
        <div className="bg-white rounded-xl shadow-sm border-t-4 border-hydroCyan p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="bg-cyan-50 p-2 rounded-full"><LineChart className="text-hydroCyan w-5 h-5"/></div>
              <h3 className="text-xl font-bold text-gray-800">Hydro Telemetry Data</h3>
            </div>
            <span className="bg-hydroLightCyan text-hydroCyan px-3 py-1 rounded-full text-sm font-bold">{sensors.length} Nodes</span>
          </div>

          <div className="space-y-4">
            {sensors.length === 0 ? <p className="text-gray-500">No telemetry active.</p> : sensors.map((sensor, index) => (
              <div key={sensor._id || index} className="border border-gray-100 rounded-lg p-5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-3 rounded-full">
                    {sensor.type === 'Moisture' ? <Droplets className="text-blue-500 w-6 h-6"/> : <Thermometer className="text-red-400 w-6 h-6"/>}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{sensor.type}</h4>
                    <p className="text-2xl font-extrabold text-hydroCyan mt-1">{sensor.value} {sensor.unit}</p>
                    <p className="text-xs text-gray-400 mt-1">Location: {sensor.location}</p>
                  </div>
                </div>
                
               <div className="w-32 h-16">
                  <ResponsiveContainer height="100%" width="100%">
                    <LineChart data={mockChartData}>
                      <Line type="monotone" dataKey="value" stroke={sensor.type === 'Moisture' ? "#00acc1" : "#ef5350"} strokeWidth={3} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;