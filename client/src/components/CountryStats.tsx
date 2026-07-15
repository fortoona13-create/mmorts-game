import React, { useState } from 'react';
import { Country } from '../../types';

interface CountryStatsProps {
  country: Country;
  resources: any;
}

const CountryStats: React.FC<CountryStatsProps> = ({ country, resources }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getHappinessColor = (level: number) => {
    if (level > 70) return 'text-green-500';
    if (level > 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHappinessEmoji = (level: number) => {
    if (level > 70) return '😊';
    if (level > 40) return '😐';
    return '😠';
  };

  return (
    <div className="bg-gray-800 border-2 border-blue-500 rounded-lg p-4 w-80 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">{country.name}</h2>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
        >
          {showDetails ? '−' : '+'}
        </button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-700 p-2 rounded">
          <div className="text-xs text-gray-400">GDP Budget</div>
          <div className="text-lg font-bold text-yellow-400">${country.gdp_budget}</div>
        </div>
        <div className={`bg-gray-700 p-2 rounded`}>
          <div className="text-xs text-gray-400">Happiness</div>
          <div className={`text-lg font-bold ${getHappinessColor(country.happiness_level)}`}>
            {getHappinessEmoji(country.happiness_level)} {country.happiness_level.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Resources */}
      <div className="bg-gray-700 p-3 rounded mb-4">
        <h3 className="text-sm font-bold text-white mb-2">Resources</h3>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-blue-300">⛽ Fuel:</span>
            <span className="text-white">{resources.fuel || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">⚙️ Metal:</span>
            <span className="text-white">{resources.metal || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-yellow-300">🌾 Food:</span>
            <span className="text-white">{resources.food || 0}</span>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      {showDetails && (
        <div className="bg-gray-700 p-3 rounded text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Tax Rate:</span>
            <span className="text-white">{(country.tax_rate * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Rebellion Risk:</span>
            <span className="text-orange-400">{country.rebellion_risk.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Status:</span>
            <span className="text-green-400">{country.is_free ? 'Free' : 'Claimed'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryStats;
