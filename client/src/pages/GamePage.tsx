import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { gameAPI } from '../../services/api';
import { setCountry, setRegions, setResources } from '../../store/slices/game.slice';
import GameMap from '../../components/GameMap';
import CountryStats from '../../components/CountryStats';
import RegionDetails from '../../components/RegionDetails';
import GlobalChat from '../../components/GlobalChat';
import MarketPanel from '../../components/MarketPanel';
import { Country, Region } from '../../types';

const GamePage: React.FC = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  const game = useSelector((state: RootState) => state.game);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [showCreateCountry, setShowCreateCountry] = useState(false);
  const [countryName, setCountryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadGameData();
    const interval = setInterval(loadGameData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadGameData = async () => {
    try {
      const response = await gameAPI.getMyCountry();
      dispatch(setCountry(response.data.country));
      dispatch(setRegions(response.data.regions));
      const resourcesMap = response.data.resources.reduce(
        (acc: any, r: any) => ({ ...acc, [r.resource_type]: r.quantity }),
        {}
      );
      dispatch(setResources(resourcesMap));
    } catch (error: any) {
      if (error.response?.status === 404) {
        setShowCreateCountry(true);
      } else {
        console.error('Failed to load game data:', error);
      }
    }
  };

  const handleCreateCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!countryName.trim()) return;

    setIsCreating(true);
    try {
      await gameAPI.createCountry(countryName);
      setCountryName('');
      setShowCreateCountry(false);
      await loadGameData();
    } catch (error) {
      console.error('Failed to create country:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!game.myCountry) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        {showCreateCountry ? (
          <div className="bg-gray-800 border-2 border-cyan-500 rounded-lg p-8 w-96">
            <h2 className="text-2xl font-bold text-white mb-6">🏛️ Found Your Country</h2>
            <p className="text-gray-300 mb-4">You need 50 stars to create a country.</p>
            <p className="text-yellow-400 font-bold mb-6">Your Stars: {auth.user?.stars || 0}</p>
            <form onSubmit={handleCreateCountry} className="space-y-4">
              <input
                type="text"
                value={countryName}
                onChange={(e) => setCountryName(e.target.value)}
                placeholder="Enter country name"
                className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded focus:outline-none focus:border-cyan-400"
                disabled={isCreating}
              />
              <button
                type="submit"
                disabled={isCreating || (auth.user?.stars || 0) < 50}
                className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white font-bold py-2 rounded"
              >
                {isCreating ? 'Creating...' : 'Create Country'}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-white text-xl">Loading...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b-2 border-cyan-500 p-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400">🎮 MMORTS</h1>
            <p className="text-sm text-gray-400">Welcome, {auth.user?.username}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-400">Stars</p>
              <p className="text-2xl font-bold text-yellow-400">{auth.user?.stars || 0} ⭐</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto max-h-[calc(100vh-80px)] space-y-4">
          <CountryStats country={game.myCountry} resources={game.resources} />
          <GlobalChat username={auth.user?.username} />
          <MarketPanel />
        </div>

        {/* Map Area */}
        <div className="flex-1">
          <GameMap regions={game.myRegions} onRegionClick={setSelectedRegion} />
        </div>
      </div>

      {/* Region Details Modal */}
      {selectedRegion && (
        <RegionDetails
          region={selectedRegion}
          onClose={() => setSelectedRegion(null)}
        />
      )}
    </div>
  );
};

export default GamePage;
