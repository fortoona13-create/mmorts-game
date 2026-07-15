import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Navigation */}
      <nav className="border-b border-cyan-500 bg-gray-800 bg-opacity-50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
            🎮 MMORTS
          </h1>
          <div className="space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-gray-900 rounded font-bold transition"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded font-bold hover:shadow-lg transition"
            >
              Register
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <h2 className="text-5xl font-bold text-white mb-4">
              Build Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Empire</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Welcome to MMORTS - a modern geopolitics simulation where you command nations, engage in diplomacy, wage wars, and dominate the global market.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-lg text-gray-200">
                <span className="text-2xl">🗺️</span>
                <span>Control multiple regions and manage resources</span>
              </div>
              <div className="flex items-center gap-3 text-lg text-gray-200">
                <span className="text-2xl">💣</span>
                <span>Launch drone strikes and military campaigns</span>
              </div>
              <div className="flex items-center gap-3 text-lg text-gray-200">
                <span className="text-2xl">📈</span>
                <span>Trade on global markets and profit</span>
              </div>
              <div className="flex items-center gap-3 text-lg text-gray-200">
                <span className="text-2xl">🤝</span>
                <span>Form alliances and negotiate with other players</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/register')}
              className="mt-8 px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg rounded hover:shadow-2xl transition"
            >
              Start Playing Now →
            </button>
          </div>

          {/* Right - Stats */}
          <div className="space-y-4">
            <div className="bg-gray-800 border-2 border-cyan-500 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-cyan-400 mb-4">🎮 Game Features</h3>
              <div className="space-y-3 text-gray-300">
                <div>
                  <p className="font-bold text-white">Real-Time Economy</p>
                  <p className="text-sm">Dynamic market prices based on supply and demand</p>
                </div>
                <div>
                  <p className="font-bold text-white">Military Strategy</p>
                  <p className="text-sm">Drone strikes, troop movements, and PVO defense systems</p>
                </div>
                <div>
                  <p className="font-bold text-white">Citizen Happiness</p>
                  <p className="text-sm">Manage taxes, food, and military morale to prevent rebellions</p>
                </div>
                <div>
                  <p className="font-bold text-white">Global Alliances</p>
                  <p className="text-sm">Form pacts and coordinate with other players</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-cyan-500 bg-gray-800 bg-opacity-50 mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-400">
          <p>© 2026 MMORTS. All rights reserved. | <span className="text-cyan-400">Modern Geopolitics Simulation</span></p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
