'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { LEVELS, generateLevel, LevelConfig } from '../../../features/basket-game/config/levels';
import { ITEM_CONFIGS, ALL_ITEM_TYPES } from '../../../features/basket-game/config/items';
import { useGameEngine } from '../../../features/basket-game/model/useGameEngine';
import { useMatchLogic } from '../../../features/basket-game/model/useMatchLogic';
import { useGameStore } from '../../../features/basket-game/model/useGameStore';
import GameCanvas from '../../../features/basket-game/ui/GameCanvas';
import GameHUD from '../../../features/basket-game/ui/GameHUD';
import ModalBoosterHint from '../../modals/ui/ModalBoosterHint';
import ModalBoosterSelect from '../../modals/ui/ModalBoosterSelect';
import type { ItemType, NetState, StoneSize, BoosterType } from '../../../features/basket-game/model/types';

const NET_STATES: NetState[] = ['strong', 'weak', 'fragile'];
const STONE_SIZES: StoneSize[] = ['large', 'medium', 'small'];

export default function LevelEditor() {
  const [selectedId, setSelectedId] = useState(1);
  const [config, setConfig] = useState<LevelConfig>(() => LEVELS[0]);
  const [previewKey, setPreviewKey] = useState(0);
  const [attempts, setAttempts] = useState(100);

  const { itemsRef, initGame, destroyChain, activateBoosterMode, cancelBooster, applyBooster } =
    useGameEngine(config);

  const { status, activeBooster } = useGameStore();
  const { chainLineRef, handlers } = useMatchLogic(itemsRef, destroyChain);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPreviewKey((k) => k + 1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [config]);

  useEffect(() => {
    const t = setTimeout(initGame, 80);
    return () => clearTimeout(t);
  }, [previewKey, initGame]);

  const handleLevelChange = useCallback((id: number) => {
    setSelectedId(id);
    setConfig(LEVELS.find((l) => l.id === id) ?? LEVELS[0]);
  }, []);

  const handleAutoGenerate = useCallback(() => {
    setConfig(generateLevel(selectedId));
  }, [selectedId]);

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `level_${config.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [config]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target?.result as string) as LevelConfig;
          setConfig(parsed);
        } catch {
          alert('Неверный формат JSON');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  const handleBoosterClick = useCallback(
    (type: BoosterType) => {
      if (status === 'booster_mode' && activeBooster.type === type) {
        cancelBooster();
      } else {
        activateBoosterMode(type);
      }
    },
    [status, activeBooster, activateBoosterMode, cancelBooster],
  );

  const handleCanvasDown = useCallback(
    (x: number, y: number) => {
      if (status === 'booster_mode' && activeBooster.type && activeBooster.type !== 'blender') {
        for (const item of itemsRef.current.values()) {
          const dx = x - item.body.position.x;
          const dy = y - item.body.position.y;
          const r = item.body.circleRadius ?? 0;
          if (dx * dx + dy * dy <= r * r) {
            applyBooster(activeBooster.type, item.id);
            return;
          }
        }
        cancelBooster();
        return;
      }
      handlers.handlePointerDown(x, y);
    },
    [status, activeBooster, itemsRef, applyBooster, cancelBooster, handlers],
  );

  const handleBlenderSelect = useCallback(
    (type: ItemType) => {
      applyBooster('blender', type);
    },
    [applyBooster],
  );

  const toggleType = useCallback((type: ItemType) => {
    setConfig((prev) => {
      const has = prev.availableTypes.includes(type);
      const next = has ? prev.availableTypes.filter((t) => t !== type) : [...prev.availableTypes, type];
      if (next.length === 0) return prev;
      return { ...prev, availableTypes: next, spawnWeights: Object.fromEntries(next.map((t) => [t, 1])) };
    });
  }, []);

  const setMovesLimit = useCallback((value: string) => {
    const parsed = parseInt(value, 10);
    setConfig((prev) => ({
      ...prev,
      movesLimit: Number.isNaN(parsed) ? 0 : Math.max(0, parsed),
    }));
  }, []);

  const upsertNetBlocker = useCallback(
    (state: NetState, updates: { count?: number; wrapsType?: ItemType }) => {
      setConfig((prev) => {
        const current = prev.netBlockers.find((blocker) => blocker.initialState === state);
        const nextCount = Math.max(0, updates.count ?? current?.count ?? 0);
        const nextWrapsType = updates.wrapsType ?? current?.wrapsType ?? prev.availableTypes[0];
        const nextNetBlockers = prev.netBlockers.filter((blocker) => blocker.initialState !== state);

        if (nextCount > 0) {
          nextNetBlockers.push({
            initialState: state,
            wrapsType: nextWrapsType,
            count: nextCount,
          });
        }

        return { ...prev, netBlockers: nextNetBlockers };
      });
    },
    [],
  );

  const toggleNetBlockers = useCallback((enabled: boolean) => {
    setConfig((prev) => ({
      ...prev,
      netBlockers: enabled
        ? [{ wrapsType: prev.availableTypes[0], initialState: 'strong', count: 1 }]
        : [],
    }));
  }, []);

  const upsertStoneBlocker = useCallback((size: StoneSize, count: number) => {
    setConfig((prev) => {
      const nextCount = Math.max(0, count);
      const nextStoneBlockers = prev.stoneBlockers.filter((blocker) => blocker.size !== size);

      if (nextCount > 0) {
        nextStoneBlockers.push({ size, count: nextCount });
      }

      return { ...prev, stoneBlockers: nextStoneBlockers };
    });
  }, []);

  const toggleStoneBlockers = useCallback((enabled: boolean) => {
    setConfig((prev) => ({
      ...prev,
      stoneBlockers: enabled ? [{ size: 'small', count: 1 }] : [],
    }));
  }, []);

  return (
    <div className="flex h-screen bg-gray-100" style={{ minWidth: 1024 }}>
      {/* ══ ЛЕВАЯ ПАНЕЛЬ ══ */}
      <div className="w-[420px] flex-shrink-0 bg-white shadow-lg flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-green-700 mb-3">Редактор уровней</h2>

          <div className="flex gap-2 mb-2">
            <select
              value={selectedId}
              onChange={(e) => handleLevelChange(parseInt(e.target.value))}
              className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
            >
              {LEVELS.map((l) => (
                <option key={l.id} value={l.id}>{l.name} ({l.zone})</option>
              ))}
            </select>
            <button onClick={handleAutoGenerate} title="Авто-генерация"
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">⚡</button>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport}
              className="flex-1 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs">📥 Экспорт</button>
            <button onClick={handleImport}
              className="flex-1 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs">📤 Импорт</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Попытки */}
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-1">Попытки (тест)</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setAttempts((a) => Math.max(1, a - 1))}
                className="w-7 h-7 bg-gray-100 rounded font-bold text-sm hover:bg-gray-200">−</button>
              <input type="number" value={attempts} min={1} max={999}
                onChange={(e) => setAttempts(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center border border-gray-300 rounded p-1 text-sm" />
              <button onClick={() => setAttempts((a) => Math.min(999, a + 1))}
                className="w-7 h-7 bg-gray-100 rounded font-bold text-sm hover:bg-gray-200">+</button>
            </div>
          </div>

          {/* Ходы */}
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-1">Ходы: <b>{config.movesLimit}</b></div>
            <input
              type="number"
              min={0}
              max={999}
              value={config.movesLimit}
              onChange={(e) => setMovesLimit(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 text-sm"
            />
          </div>

          {/* Цель */}
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-1">Цель (очков): <b>{config.harvestGoalPoints}</b></div>
            <input type="range" min={50} max={2000} step={10} value={config.harvestGoalPoints}
              onChange={(e) => setConfig((p) => ({ ...p, harvestGoalPoints: parseInt(e.target.value) }))}
              className="w-full" />
          </div>

          {/* Шанс золотого */}
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-1">
              Золотой: <b className="text-yellow-500">{Math.round(config.goldenSpawnChance * 100)}%</b>
            </div>
            <input type="range" min={0} max={40}
              value={Math.round(config.goldenSpawnChance * 100)}
              onChange={(e) => setConfig((p) => ({ ...p, goldenSpawnChance: parseInt(e.target.value) / 100 }))}
              className="w-full" />
          </div>

          {/* Появление блокеров */}
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-1">
              Появление блокеров при досыпке: <b>{config.blockerSpawnChance.toFixed(2)}</b>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(config.blockerSpawnChance * 100)}
              onChange={(e) =>
                setConfig((p) => ({
                  ...p,
                  blockerSpawnChance: parseInt(e.target.value, 10) / 100,
                }))
              }
              className="w-full"
            />
          </div>

          {/* Предметы */}
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-2">Предметы</div>
            <div className="grid grid-cols-5 gap-1.5">
              {ALL_ITEM_TYPES.map((type) => {
                const cfg = ITEM_CONFIGS[type];
                const active = config.availableTypes.includes(type);
                return (
                  <button key={type} onClick={() => toggleType(type)}
                    className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border text-center transition-all ${
                      active ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50 opacity-40'}`}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: cfg.color }}>{cfg.label.charAt(0)}</div>
                    <span className="text-[8px] text-gray-400 leading-tight">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Блокеры: Сеть */}
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-2">Блокеры</div>
            <div className="space-y-2">
              {/* Сеть */}
              <div className="p-2 bg-gray-50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium">Сеть</div>
                    <div className="text-[10px] text-gray-400">strong→weak→fragile→free</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.netBlockers.length > 0}
                    onChange={(e) => toggleNetBlockers(e.target.checked)}
                  />
                </div>
                {config.netBlockers.length > 0 && (
                  <div className="space-y-1.5">
                    {NET_STATES.map((state) => {
                      const blocker = config.netBlockers.find((item) => item.initialState === state);
                      return (
                        <div key={state} className="grid grid-cols-[84px_1fr_64px] items-center gap-2">
                          <div className="text-[11px] font-medium text-gray-600">
                            {state === 'strong' ? 'Прочная' : state === 'weak' ? 'Средняя' : 'Хрупкая'}
                          </div>
                          <select
                            value={blocker?.wrapsType ?? config.availableTypes[0]}
                            onChange={(e) =>
                              upsertNetBlocker(state, {
                                wrapsType: e.target.value as ItemType,
                                count: blocker?.count ?? 1,
                              })
                            }
                            className="border border-gray-300 rounded px-2 py-1 text-xs"
                          >
                            {config.availableTypes.map((type) => (
                              <option key={type} value={type}>
                                {ITEM_CONFIGS[type].label}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min={0}
                            max={99}
                            value={blocker?.count ?? 0}
                            onChange={(e) =>
                              upsertNetBlocker(state, { count: parseInt(e.target.value, 10) || 0 })
                            }
                            className="w-full text-center border border-gray-300 rounded text-xs p-1"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Камень */}
              <div className="p-2 bg-gray-50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium">Камень</div>
                    <div className="text-[10px] text-gray-400">large=3, medium=2, small=1 хит</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.stoneBlockers.length > 0}
                    onChange={(e) => toggleStoneBlockers(e.target.checked)}
                  />
                </div>
                {config.stoneBlockers.length > 0 && (
                  <div className="space-y-1.5">
                    {STONE_SIZES.map((size) => {
                      const blocker = config.stoneBlockers.find((item) => item.size === size);
                      return (
                        <div key={size} className="grid grid-cols-[84px_64px] justify-between items-center gap-2">
                          <div className="text-[11px] font-medium text-gray-600">
                            {size === 'large' ? 'Большой' : size === 'medium' ? 'Средний' : 'Малый'}
                          </div>
                          <input
                            type="number"
                            min={0}
                            max={99}
                            value={blocker?.count ?? 0}
                            onChange={(e) => upsertStoneBlocker(size, parseInt(e.target.value, 10) || 0)}
                            className="w-full text-center border border-gray-300 rounded text-xs p-1"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Бустеры */}
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-2">Стартовые бустеры</div>
            <div className="grid grid-cols-3 gap-2">
              {(['watering', 'skewer', 'blender'] as BoosterType[]).map((type) => {
                const labels: Record<BoosterType, string> = { watering: '💧 Лейка', skewer: '🗡 Шампур', blender: '🌀 Блендер' };
                return (
                  <div key={type} className="text-center">
                    <div className="text-[10px] text-gray-400 mb-1">{labels[type]}</div>
                    <input type="number" min={0} max={5} value={config.startBoosters[type] ?? 0}
                      onChange={(e) => setConfig((p) => ({ ...p, startBoosters: { ...p.startBoosters, [type]: parseInt(e.target.value) || 0 } }))}
                      className="w-full text-center border border-gray-300 rounded p-1 text-sm" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* JSON */}
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-1">JSON</div>
            <pre className="text-[10px] bg-gray-50 p-2 rounded border border-gray-200 overflow-auto max-h-40">
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* ══ ПРАВАЯ ПАНЕЛЬ: ПРЕВЬЮ ══ */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-200 p-6 gap-3">
        <div className="text-sm text-gray-500 font-medium">
          Живое превью — {config.name} · {config.zone}
        </div>
        <div className="relative flex-1 w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-300">
          <GameCanvas
            itemsRef={itemsRef}
            chainLineRef={chainLineRef}
            onPointerDown={handleCanvasDown}
            onPointerMove={handlers.handlePointerMove}
            onPointerUp={handlers.handlePointerUp}
          />
          <GameHUD onBoosterClick={handleBoosterClick} />

          {status === 'booster_mode' && activeBooster.type && activeBooster.type !== 'blender' && (
            <ModalBoosterHint boosterType={activeBooster.type} onCancel={cancelBooster} />
          )}

          {status === 'booster_mode' && activeBooster.type === 'blender' && (
            <ModalBoosterSelect
              availableTypes={config.availableTypes}
              onSelect={handleBlenderSelect}
              onCancel={cancelBooster}
            />
          )}

          {(status === 'win' || status === 'lose') && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-40">
              <div className="bg-white rounded-xl p-6 text-center shadow-xl">
                <div className="text-2xl font-bold mb-3">
                  {status === 'win' ? '🌿 Победа!' : '😔 Проигрыш'}
                </div>
                <button onClick={() => setPreviewKey((k) => k + 1)}
                  className="px-5 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 text-sm">
                  Перезапустить
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
