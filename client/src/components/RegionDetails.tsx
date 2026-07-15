import React, { useState } from 'react';
import { Region } from '../../types';

interface RegionDetailsProps {
  region: Region;
  onClose: () => void;
  onAttack?: (fromRegionId: string, toRegionId: string, troops: number) => void;
}

const RegionDetails: React.FC<RegionDetailsProps> = ({ region, onClose, onAttack }) => {
  const [attackTroops, setAttackTroops] = useState(10);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 border-2 border-cyan-500 rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">{region.name}</h2>
          <button
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>

        {/* Region Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-700 p-3 rounded text-center">
            <div className="text-xs text-gray-400">Population</div>
            <div className="text-xl font-bold text-blue-400">{region.population.toLocaleString()}</div>
          </div>
          <div className="bg-gray-700 p-3 rounded text-center">
            <div className="text-xs text-gray-400">Morale</div>
            <div className="text-xl font-bold text-yellow-400">{region.morale_level.toFixed(1)}%</div>
          </div>
          <div className="bg-gray-700 p-3 rounded text-center">
            <div className="text-xs text-gray-400">Military Units</div>
            <div className="text-xl font-bold text-red-400">{region.military_units}</div>
          </div>
          <div className="bg-gray-700 p-3 rounded text-center">
            <div className="text-xs text-gray-400">PVO Level</div>
            <div className="text-xl font-bold text-purple-400">{region.air_defense_level}</div>
          </div>
        </div>

        {/* Resources Storage */}
        <div className="bg-gray-700 p-3 rounded mb-4">
          <h3 className="text-sm font-bold text-white mb-2">Storage</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span>🌾 Food:</span>
              <span className="text-yellow-300">{region.food_storage}</span>
            </div>
            <div className="flex justify-between">
              <span>⛽ Fuel:</span>
              <span className="text-blue-300">{region.fuel_storage}</span>
            </div>
            <div className="flex justify-between">
              <span>⚙️ Metal:</span>
              <span className="text-gray-300">{region.metal_storage}</span>
            </div>
          </div>
        </div>

        {/* Attack Section */}
        {onAttack && (
          <div className="bg-red-900 bg-opacity-30 p-3 rounded border border-red-500">
            <h3 className="text-sm font-bold text-red-300 mb-2">⚔️ Attack</h3>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max={region.military_units}
                value={attackTroops}
                onChange={(e) => setAttackTroops(parseInt(e.target.value))}
                className="flex-1 bg-gray-600 text-white px-2 py-1 rounded text-sm"
              />
              <button
                onClick={() => onAttack(region.id, region.id, attackTroops)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-bold"
              >
                Attack
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegionDetails;
