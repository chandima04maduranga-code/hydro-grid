import React, { useState } from 'react';
import { Leaf, Lock, User, BarChart2, Settings, ShieldCheck } from 'lucide-react';

const Login = ({ setAuth }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    // Add your login API call logic here (from Day 6)
    // If successful:
    setAuth(true); 
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-6">
      <div className="bg-white rounded-2xl shadow-xl flex flex-col md:flex-row w-full max-w-5xl overflow-hidden">
        
        {/* Left Side - Marketing/Info */}
        <div className="w-full md:w-1/2 bg-green-50 p-10 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-8">
            <Leaf className="text-hydroGreen w-8 h-8"/>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">Hydro_Grid</h1>
              <p className="text-sm text-gray-500">Smart Hydroponic Management</p>
            </div>
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Smarter Hydroponics <br/>for a <span className="text-hydroGreen">Greener Tomorrow</span></h2>
          <p className="text-gray-600 mb-8">Monitor, manage and grow healthier crops with real-time data and intelligent control.</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <BarChart2 className="text-hydroGreen mb-2"/>
              <h4 className="font-bold text-sm">Real-time Monitoring</h4>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <Settings className="text-hydroGreen mb-2"/>
              <h4 className="font-bold text-sm">Smart Management</h4>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900">Welcome Back</h3>
            <p className="text-gray-500 mt-1">Sign in to access your control panel</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400 w-5 h-5"/>
              <input type="text" placeholder="Username" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hydroGreen" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5"/>
              <input type="password" placeholder="Password" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hydroGreen" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded text-hydroGreen focus:ring-hydroGreen" />
                <span className="text-gray-600">Remember me</span>
              </label>
              <span className="text-hydroGreen font-semibold cursor-pointer">Forgot password?</span>
            </div>

            <button type="submit" className="w-full bg-hydroGreen hover:bg-green-800 text-white font-bold py-3 px-4 rounded-lg transition-colors">
              Login
            </button>
          </form>

          <div className="mt-8 bg-green-50 p-4 rounded-lg flex items-center gap-3">
            <ShieldCheck className="text-hydroGreen w-6 h-6"/>
            <div className="text-xs text-gray-600">
              <strong>Secure Access</strong><br/>Only authorized users can access the system.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;