'use client';

import { useState } from 'react';
import { LEVELS, generateLevel, LevelConfig } from '../../../features/basket-game/config/levels';

export default function LevelEditor() {
  const [selectedLevelId, setSelectedLevelId] = useState(1);
  const [levelConfig, setLevelConfig] = useState<LevelConfig>(LEVELS[0]);

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    setSelectedLevelId(id);
    const config = LEVELS.find(l => l.id === id);
    if (config) setLevelConfig(config);
  };

  const handleGenerate = () => {
    const newConfig = generateLevel(selectedLevelId);
    setLevelConfig(newConfig);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Panel - Config */}
      <div className="w-1/3 p-4 bg-white shadow-lg overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Level Editor</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Select Level</label>
          <div className="flex gap-2">
            <select 
              value={selectedLevelId} 
              onChange={handleLevelChange}
              className="flex-1 p-2 border rounded"
            >
              {LEVELS.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <button 
              onClick={handleGenerate}
              className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              ⚡
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Moves Limit: {levelConfig.movesLimit}</label>
            <input 
              type="range" 
              min="5" 
              max="50" 
              value={levelConfig.movesLimit} 
              onChange={(e) => setLevelConfig({...levelConfig, movesLimit: parseInt(e.target.value)})}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Spawn Interval (ms): {levelConfig.spawnInterval}</label>
            <input 
              type="range" 
              min="400" 
              max="2000" 
              value={levelConfig.spawnInterval} 
              onChange={(e) => setLevelConfig({...levelConfig, spawnInterval: parseInt(e.target.value)})}
              className="w-full"
            />
          </div>
          
           <div>
            <label className="block text-sm font-medium">Golden Chance: {(levelConfig.goldenChance * 100).toFixed(0)}%</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={levelConfig.goldenChance * 100} 
              onChange={(e) => setLevelConfig({...levelConfig, goldenChance: parseInt(e.target.value) / 100})}
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded">
          <h3 className="font-bold mb-2">JSON Config</h3>
          <pre className="text-xs overflow-auto h-40">
            {JSON.stringify(levelConfig, null, 2)}
          </pre>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 flex justify-center items-center bg-gray-200 relative">
        <div className="text-center">
            <p className="text-gray-500 mb-4">Preview Area (Placeholder)</p>
            {/* Here we would mount GameCanvas with current config */}
            <div className="w-[360px] h-[640px] bg-white border-2 border-gray-300 relative shadow-xl rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    Game Preview
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
