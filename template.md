# Промпт: «Весеннее лукошко» — Physics Line Match Game

> Используй этот промпт целиком для генерации игры. Он содержит все детали механики, архитектуры, конфигурации и UI.

---

## КОНТЕКСТ ПРОЕКТА

Ты реализуешь мини-игру **«Весеннее лукошко»** — кор-механику рекламной игры **«Дача на удачу»** для сети Магнит.

**Стек:** Next.js 15 (App Router), React 19, TypeScript, SCSS Modules, Matter.js (физика), Canvas 2D (рендер игровой сцены).

**Платформа:** WebView / Mobile (вертикальная ориентация, touch-first). Десктопный режим — только для редактора уровней.

**Требования по производительности:** стабильные 60fps на мобильных устройствах, размер бандла < 45 МБ, lazy-loading игрового виджета.

---

## АРХИТЕКТУРА FSD

Соблюдай Feature-Sliced Design:

```
src/
├── app/
│   └── (view)/
│       └── game/
│           └── page.tsx                  // Страница игры
├── features/
│   └── basket-game/                      // Кор-игра
│       ├── ui/
│       │   ├── GameCanvas.tsx            // Canvas-рендер физической сцены
│       │   ├── GameHUD.tsx               // Верхняя панель (ходы, очки, шкала урожая)
│       │   ├── BoosterPanel.tsx          // Нижняя панель бустеров
│       │   ├── OverflowLine.tsx          // Красная линия переполнения
│       │   └── VegetableSprite.tsx       // Компонент спрайта овоща
│       ├── model/
│       │   ├── useGameEngine.ts          // Главный хук физики + игровой логики
│       │   ├── useMatchLogic.ts          // Логика соединения линией
│       │   ├── useSpawner.ts             // Спавн объектов
│       │   ├── gameSlice.ts              // Redux: очки, ходы, состояние уровня
│       │   └── types.ts                 // GameState, VegetableBody, Booster и т.д.
│       ├── config/
│       │   ├── levels.ts                 // Конфиг всех 60 уровней
│       │   ├── vegetables.ts             // Типы овощей и их физ. параметры
│       │   └── boosters.ts               // Конфиг бустеров
│       └── lib/
│           ├── physics.ts                // Инициализация Matter.js
│           ├── matchUtils.ts             // Проверка соседства, валидация цепочки
│           └── effectsCanvas.ts          // Эффекты уничтожения (Fruit Ninja)
├── widgets/
│   └── level-editor/                     // Десктопный редактор уровней
│       ├── ui/
│       │   ├── LevelEditor.tsx           // Главный layout редактора
│       │   ├── LevelSelector.tsx         // Дропдаун выбора уровня
│       │   ├── LevelPreview.tsx          // Превью лукошка с объектами
│       │   ├── LevelConfigForm.tsx       // Форма параметров уровня
│       │   └── AttemptsCounter.tsx       // Счётчик попыток с редактированием
│       └── model/
│           └── useLevelEditor.ts         // Стейт редактора
└── shared/
    ├── store/
    │   └── gameStore.ts
    └── ui/
        └── modals/
            ├── ModalWin.tsx
            ├── ModalLose.tsx
            └── ModalSecondChance.tsx
```

---

## ЧАСТЬ 1: ФИЗИЧЕСКИЙ ДВИЖОК

### Инициализация Matter.js

```typescript
// features/basket-game/lib/physics.ts

import Matter from 'matter-js';

export interface PhysicsConfig {
  canvasWidth: number;
  canvasHeight: number;
  gravity: number; // default: 1.5
}

export function initPhysicsEngine(config: PhysicsConfig) {
  const engine = Matter.Engine.create({
    gravity: { y: config.gravity },
    positionIterations: 10,
    velocityIterations: 8,
  });

  const runner = Matter.Runner.create();

  return { engine, runner };
}
```

### Физическое лукошко

Лукошко — **U-образный контейнер** из трёх статических тел Matter.js:

- Левая стенка: прямоугольник, слегка наклонён внутрь (~5°)
- Правая стенка: прямоугольник, слегка наклонён внутрь (~5°)
- Дно: прямоугольник горизонтальный

```typescript
export function createBasketBodies(
  cx: number, // центр X
  cy: number, // центр Y
  width: number,
  height: number,
): Matter.Body[] {
  const wallThickness = 20;
  const tiltAngle = 0.08; // ~5 градусов

  const bottom = Matter.Bodies.rectangle(
    cx,
    cy + height / 2,
    width,
    wallThickness,
    { isStatic: true, friction: 0.8, restitution: 0.2, label: 'basket-wall' },
  );

  const leftWall = Matter.Bodies.rectangle(
    cx - width / 2,
    cy,
    wallThickness,
    height,
    {
      isStatic: true,
      friction: 0.8,
      restitution: 0.2,
      label: 'basket-wall',
      angle: tiltAngle,
    },
  );

  const rightWall = Matter.Bodies.rectangle(
    cx + width / 2,
    cy,
    wallThickness,
    height,
    {
      isStatic: true,
      friction: 0.8,
      restitution: 0.2,
      label: 'basket-wall',
      angle: -tiltAngle,
    },
  );

  return [bottom, leftWall, rightWall];
}
```

### Физические тела овощей

```typescript
// features/basket-game/config/vegetables.ts

export type VegetableType =
  | 'tomato'
  | 'cucumber'
  | 'pepper'
  | 'eggplant'
  | 'onion'
  | 'carrot'
  | 'watermelon'
  | 'pumpkin' // блокеры
  | 'golden_tomato'
  | 'golden_cucumber'; // золотые

export interface VegetableConfig {
  type: VegetableType;
  radius: number; // радиус физ. тела
  mass: number; // масса (влияет на физику)
  restitution: number; // упругость 0..1
  friction: number; // трение 0..1
  frictionAir: number; // сопротивление воздуха
  spritePath: string; // путь к спрайту
  color: string; // fallback цвет
  isBlocker: boolean;
  isGolden: boolean;
  pointValue: number; // базовые очки за уничтожение
}

export const VEGETABLE_CONFIGS: Record<VegetableType, VegetableConfig> = {
  tomato: {
    type: 'tomato',
    radius: 28,
    mass: 1,
    restitution: 0.3,
    friction: 0.6,
    frictionAir: 0.01,
    spritePath: '/game/tomato.png',
    color: '#E53935',
    isBlocker: false,
    isGolden: false,
    pointValue: 10,
  },
  cucumber: {
    type: 'cucumber',
    radius: 26,
    mass: 0.9,
    restitution: 0.2,
    friction: 0.7,
    frictionAir: 0.01,
    spritePath: '/game/cucumber.png',
    color: '#43A047',
    isBlocker: false,
    isGolden: false,
    pointValue: 10,
  },
  pepper: {
    type: 'pepper',
    radius: 24,
    mass: 0.85,
    restitution: 0.25,
    friction: 0.65,
    frictionAir: 0.01,
    spritePath: '/game/pepper.png',
    color: '#FB8C00',
    isBlocker: false,
    isGolden: false,
    pointValue: 10,
  },
  eggplant: {
    type: 'eggplant',
    radius: 27,
    mass: 1.1,
    restitution: 0.2,
    friction: 0.7,
    frictionAir: 0.01,
    spritePath: '/game/eggplant.png',
    color: '#7B1FA2',
    isBlocker: false,
    isGolden: false,
    pointValue: 15,
  },
  onion: {
    type: 'onion',
    radius: 25,
    mass: 0.95,
    restitution: 0.25,
    friction: 0.6,
    frictionAir: 0.01,
    spritePath: '/game/onion.png',
    color: '#F9A825',
    isBlocker: false,
    isGolden: false,
    pointValue: 15,
  },
  carrot: {
    type: 'carrot',
    radius: 23,
    mass: 0.8,
    restitution: 0.2,
    friction: 0.65,
    frictionAir: 0.01,
    spritePath: '/game/carrot.png',
    color: '#FF6F00',
    isBlocker: false,
    isGolden: false,
    pointValue: 15,
  },
  // БЛОКЕРЫ
  watermelon: {
    type: 'watermelon',
    radius: 65,
    mass: 8,
    restitution: 0.15,
    friction: 0.8,
    frictionAir: 0.005,
    spritePath: '/game/watermelon.png',
    color: '#2E7D32',
    isBlocker: true,
    isGolden: false,
    pointValue: 0,
  },
  pumpkin: {
    type: 'pumpkin',
    radius: 55,
    mass: 6,
    restitution: 0.15,
    friction: 0.8,
    frictionAir: 0.005,
    spritePath: '/game/pumpkin.png',
    color: '#E65100',
    isBlocker: true,
    isGolden: false,
    pointValue: 0,
  },
  // ЗОЛОТЫЕ (редкие)
  golden_tomato: {
    type: 'golden_tomato',
    radius: 30,
    mass: 1,
    restitution: 0.35,
    friction: 0.6,
    frictionAir: 0.01,
    spritePath: '/game/golden_tomato.png',
    color: '#FFD600',
    isBlocker: false,
    isGolden: true,
    pointValue: 30,
  },
  golden_cucumber: {
    type: 'golden_cucumber',
    radius: 28,
    mass: 0.9,
    restitution: 0.3,
    friction: 0.6,
    frictionAir: 0.01,
    spritePath: '/game/golden_cucumber.png',
    color: '#FFD600',
    isBlocker: false,
    isGolden: true,
    pointValue: 30,
  },
};
```

---

## ЧАСТЬ 2: ИГРОВЫЕ ОБЪЕКТЫ И ТИПЫ

```typescript
// features/basket-game/model/types.ts

export type GameStatus =
  | 'idle' // ещё не начата
  | 'playing' // идёт игра
  | 'paused' // пауза
  | 'win' // победа
  | 'lose_moves' // закончились ходы
  | 'lose_overflow'; // овощи вышли за линию

export type BlockerType = 'none' | 'ice' | 'stone';

export interface VegetableBody {
  id: string;
  matterBody: Matter.Body;
  type: VegetableType;
  blockerState: BlockerType; // none = обычный, ice = заморожен, stone = камень
  isSelected: boolean;
  isFrozen: boolean; // заморожен льдом
  frozenTurnsLeft: number; // сколько матчей рядом нужно для размораживания
}

export interface ChainNode {
  vegetableId: string;
  position: { x: number; y: number };
}

export interface GameState {
  status: GameStatus;
  score: number;
  movesLeft: number;
  harvestProgress: number; // 0..100
  harvestGoal: number; // цель: сколько % нужно набрать
  currentChain: ChainNode[];
  boosters: BoosterInventory;
  seedPackets: number; // пакетики семян для мета-игры
}

export interface BoosterInventory {
  blender: number; // Блендер
  skewer: number; // Шампур
  watering: number; // Лейка
  rake: number; // Грабли
  secateur: number; // Секатор (второй шанс)
  extraMoves: number; // +5 ходов (второй шанс)
}

export type BoosterType = keyof BoosterInventory;

export interface EffectParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  type: 'juice' | 'chunk' | 'star' | 'sparkle';
  lifetime: number;
  age: number;
}
```

---

## ЧАСТЬ 3: КОНФИГУРАЦИЯ УРОВНЕЙ (ГЕНЕРАТОР)

```typescript
// features/basket-game/config/levels.ts

export interface LevelConfig {
  id: number;
  name: string;

  // Цель уровня
  harvestGoal: number; // % шкалы урожая для победы (обычно 100)
  movesLimit: number; // кол-во ходов (матчей) на уровень

  // Спавн
  spawnInterval: number; // мс между спавнами (1500 → 400)
  vegetableTypes: VegetableType[]; // какие овощи могут спавниться
  spawnWeights: Record<VegetableType, number>; // вес каждого типа (вероятность)
  goldenChance: number; // вероятность спавна золотого овоща (0..1)

  // Блокеры
  blockers: {
    watermelonEnabled: boolean;
    pumpkinEnabled: boolean;
    iceEnabled: boolean;
    stonesEnabled: boolean;
    initialBlockers: InitialBlocker[]; // стартовые блокеры в лукошке
  };

  // Сложность
  preFilledVegetables: PreFilledVegetable[]; // объекты уже в лукошке на старте

  // Бустеры доступные на уровне
  availableBoosters: BoosterType[];

  // Стартовый инвентарь бустеров
  startBoosters: Partial<BoosterInventory>;

  // Метаданные
  zone: 'garden' | 'greenhouse' | 'orchard' | 'house' | 'bbq' | 'terrace';
  backgroundVariant: number; // 1..3 вариант фона зоны
}

export interface InitialBlocker {
  type: VegetableType;
  position: 'left' | 'center' | 'right' | 'random';
}

export interface PreFilledVegetable {
  type: VegetableType;
  count: number;
}

// ─── ГЕНЕРАТОР УРОВНЕЙ ───────────────────────────────────────────────

export function generateLevel(id: number): LevelConfig {
  const isEasy = id <= 10;
  const isMedium = id > 10 && id <= 50;
  const isHard = id > 50;

  const spawnInterval = isEasy
    ? 1500
    : isMedium
      ? Math.max(900, 1500 - (id - 10) * 15)
      : Math.max(400, 900 - (id - 50) * 10);

  const vegetableTypes: VegetableType[] = isEasy
    ? ['tomato', 'cucumber', 'pepper']
    : isMedium
      ? id <= 30
        ? ['tomato', 'cucumber', 'pepper', 'eggplant']
        : ['tomato', 'cucumber', 'pepper', 'eggplant', 'onion']
      : ['tomato', 'cucumber', 'pepper', 'eggplant', 'onion', 'carrot'];

  // Равные веса по умолчанию — в конкретных уровнях можно переопределить
  const spawnWeights = Object.fromEntries(
    vegetableTypes.map((t) => [t, 1]),
  ) as Record<VegetableType, number>;

  const movesLimit = isEasy
    ? 30
    : isMedium
      ? Math.max(20, 30 - Math.floor((id - 10) / 5))
      : Math.max(12, 20 - Math.floor((id - 50) / 3));

  const watermelonEnabled = id >= 15;
  const iceEnabled = id >= 25;
  const stonesEnabled = id >= 35;

  const preFilledCount = isHard ? Math.min(6, Math.floor((id - 50) / 5)) : 0;
  const preFilledVegetables: PreFilledVegetable[] =
    preFilledCount > 0 ? [{ type: 'tomato', count: preFilledCount }] : [];

  return {
    id,
    name: `Уровень ${id}`,
    harvestGoal: 100,
    movesLimit,
    spawnInterval,
    vegetableTypes,
    spawnWeights,
    goldenChance: isEasy ? 0.05 : isMedium ? 0.08 : 0.12,
    blockers: {
      watermelonEnabled,
      pumpkinEnabled: id >= 20,
      iceEnabled,
      stonesEnabled,
      initialBlockers:
        isHard && id % 10 === 0
          ? [{ type: 'watermelon', position: 'center' }]
          : [],
    },
    preFilledVegetables,
    availableBoosters: ['blender', 'skewer', 'watering', 'rake'],
    startBoosters: isEasy ? { blender: 1, skewer: 1 } : {},
    zone:
      id <= 10
        ? 'garden'
        : id <= 20
          ? 'greenhouse'
          : id <= 35
            ? 'orchard'
            : id <= 45
              ? 'house'
              : id <= 53
                ? 'bbq'
                : 'terrace',
    backgroundVariant: ((id - 1) % 3) + 1,
  };
}

// Генерируем все 60 уровней
export const LEVELS: LevelConfig[] = Array.from({ length: 60 }, (_, i) =>
  generateLevel(i + 1),
);
```

---

## ЧАСТЬ 4: ЛОГИКА МАТЧА (СОЕДИНЕНИЕ ЛИНИЕЙ)

```typescript
// features/basket-game/lib/matchUtils.ts

const MAX_CHAIN_DISTANCE = 90; // px — максимальное расстояние между соседями

export function isNeighbor(
  bodyA: VegetableBody,
  bodyB: VegetableBody,
): boolean {
  const dx = bodyA.matterBody.position.x - bodyB.matterBody.position.x;
  const dy = bodyA.matterBody.position.y - bodyB.matterBody.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const threshold =
    bodyA.matterBody.circleRadius! + bodyB.matterBody.circleRadius! + 30;
  return dist <= Math.max(threshold, MAX_CHAIN_DISTANCE);
}

export function isSameType(a: VegetableBody, b: VegetableBody): boolean {
  // Золотые считаются своим base-типом для матча
  const baseType = (t: VegetableType): string =>
    t.startsWith('golden_') ? t.replace('golden_', '') : t;
  return baseType(a.type) === baseType(b.type);
}

export function canAddToChain(
  chain: VegetableBody[],
  candidate: VegetableBody,
): boolean {
  if (candidate.isFrozen || candidate.blockerState === 'stone') return false;
  if (chain.length === 0) return true;
  if (chain.some((v) => v.id === candidate.id)) return false;

  const last = chain[chain.length - 1];
  return isNeighbor(last, candidate) && isSameType(last, candidate);
}

export function calculateChainScore(chain: VegetableBody[]): number {
  const base = chain.reduce(
    (sum, v) => sum + VEGETABLE_CONFIGS[v.type].pointValue,
    0,
  );
  const multiplier = chain.length >= 5 ? 1.5 : 1.0;
  const goldenBonus = chain.some((v) => v.type.startsWith('golden_')) ? 2 : 1;
  return Math.floor(base * multiplier * goldenBonus);
}
```

---

## ЧАСТЬ 5: ХУКИ ИГРОВОЙ ЛОГИКИ

### useGameEngine — главный хук

```typescript
// features/basket-game/model/useGameEngine.ts

export function useGameEngine(levelConfig: LevelConfig) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const vegetablesRef = useRef<Map<string, VegetableBody>>(new Map());
  const animFrameRef = useRef<number>(0);

  const [gameState, setGameState] = useState<GameState>({
    status: 'idle',
    score: 0,
    movesLeft: levelConfig.movesLimit,
    harvestProgress: 0,
    harvestGoal: levelConfig.harvestGoal,
    currentChain: [],
    boosters: { ...levelConfig.startBoosters, secateur: 0, extraMoves: 0 },
    seedPackets: 0,
  });

  // ─── ИНИЦИАЛИЗАЦИЯ ───
  const initGame = useCallback(() => {
    // Создать Matter.Engine
    // Добавить тела лукошка
    // Спавнить preFilledVegetables без анимации
    // Запустить game loop
  }, [levelConfig]);

  // ─── GAME LOOP (requestAnimationFrame) ───
  const gameLoop = useCallback(() => {
    if (!engineRef.current || !canvasRef.current) return;

    Matter.Engine.update(engineRef.current, 1000 / 60);
    renderFrame(); // рисуем Canvas
    checkOverflowLine(); // проверяем линию переполнения

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // ─── СПАВН ───
  const spawnVegetable = useCallback(() => {
    // Определить тип по весам и goldenChance
    // Создать Matter.Body с нужными параметрами
    // Добавить в engine и vegetablesRef
    // Случайная позиция X над лукошком
  }, [levelConfig]);

  // ─── ЛИНИЯ ПЕРЕПОЛНЕНИЯ ───
  const checkOverflowLine = useCallback(() => {
    // Найти объекты выше overflowY
    // Если есть — запустить 3-секундный таймер
    // По истечении — game over (lose_overflow)
  }, []);

  // ─── УНИЧТОЖЕНИЕ ЦЕПОЧКИ ───
  const destroyChain = useCallback((chain: VegetableBody[]) => {
    const score = calculateChainScore(chain);
    const progress = calculateProgressGain(chain);

    // Запустить эффект Fruit Ninja на Canvas
    // Удалить тела из Matter.Engine
    // Удалить из vegetablesRef
    // Разморозить соседей (если есть frozen рядом)
    // Обновить gameState: score, movesLeft-1, harvestProgress
    // Если harvestProgress >= harvestGoal → win
    // Если movesLeft === 0 → lose_moves
  }, []);

  return {
    canvasRef,
    gameState,
    initGame,
    destroyChain,
    activateBooster,
    resetLevel,
  };
}
```

### useMatchLogic — drag логика

```typescript
// features/basket-game/model/useMatchLogic.ts

export function useMatchLogic(
  vegetables: Map<string, VegetableBody>,
  onChainComplete: (chain: VegetableBody[]) => void,
) {
  const [chain, setChain] = useState<VegetableBody[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const chainLineRef = useRef<{ x: number; y: number }[]>([]);

  const handlePointerDown = useCallback(
    (canvasX: number, canvasY: number) => {
      const hit = hitTestVegetable(vegetables, canvasX, canvasY);
      if (hit && canAddToChain([], hit)) {
        setIsDragging(true);
        setChain([hit]);
        chainLineRef.current = [
          { x: hit.matterBody.position.x, y: hit.matterBody.position.y },
        ];
      }
    },
    [vegetables],
  );

  const handlePointerMove = useCallback(
    (canvasX: number, canvasY: number) => {
      if (!isDragging || chain.length === 0) return;

      const hit = hitTestVegetable(vegetables, canvasX, canvasY);
      if (hit && canAddToChain(chain, hit)) {
        setChain((prev) => [...prev, hit]);
        chainLineRef.current = [
          ...chainLineRef.current,
          {
            x: hit.matterBody.position.x,
            y: hit.matterBody.position.y,
          },
        ];
      }

      // Отмена последнего (drag назад)
      if (chain.length >= 2) {
        const secondLast = chain[chain.length - 2];
        const hitId = hitTestVegetable(vegetables, canvasX, canvasY)?.id;
        if (hitId === secondLast.id) {
          setChain((prev) => prev.slice(0, -1));
          chainLineRef.current = chainLineRef.current.slice(0, -1);
        }
      }
    },
    [isDragging, chain, vegetables],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    if (chain.length >= 3) {
      onChainComplete(chain);
    }
    setChain([]);
    chainLineRef.current = [];
  }, [chain, onChainComplete]);

  return {
    chain,
    isDragging,
    chainLineRef,
    handlers: { handlePointerDown, handlePointerMove, handlePointerUp },
  };
}

function hitTestVegetable(
  vegetables: Map<string, VegetableBody>,
  x: number,
  y: number,
): VegetableBody | null {
  for (const veg of vegetables.values()) {
    const { position, circleRadius } = veg.matterBody;
    const dx = x - position.x;
    const dy = y - position.y;
    if (dx * dx + dy * dy <= circleRadius! * circleRadius!) {
      return veg;
    }
  }
  return null;
}
```

---

## ЧАСТЬ 6: CANVAS РЕНДЕР

```typescript
// features/basket-game/ui/GameCanvas.tsx

// Canvas — главный экран игры. Рисует:
// 1. Фоновый спрайт лукошка
// 2. Все VegetableBody по их Matter.positions
// 3. Линию цепочки (стебель) поверх
// 4. Эффект красного мигания линии переполнения
// 5. Частицы эффектов (EffectParticle[])
// 6. Ледяную корку поверх frozen объектов
// 7. Иконку камня поверх stone объектов

function renderVegetable(
  ctx: CanvasRenderingContext2D,
  veg: VegetableBody,
  sprites: Map<VegetableType, HTMLImageElement>,
  isSelected: boolean,
) {
  const { position, circleRadius, angle } = veg.matterBody;
  const config = VEGETABLE_CONFIGS[veg.type];

  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate(angle);

  // Тень для выбранных
  if (isSelected) {
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 12;
  }

  const sprite = sprites.get(veg.type);
  if (sprite) {
    const r = circleRadius!;
    ctx.drawImage(sprite, -r, -r, r * 2, r * 2);
  } else {
    // Fallback: цветной круг
    ctx.beginPath();
    ctx.arc(0, 0, circleRadius!, 0, Math.PI * 2);
    ctx.fillStyle = config.color;
    ctx.fill();
  }

  // Ледяная корка
  if (veg.isFrozen) {
    ctx.beginPath();
    ctx.arc(0, 0, circleRadius! + 4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(150, 200, 255, 0.7)';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = 'rgba(180, 220, 255, 0.25)';
    ctx.fill();
  }

  // Золотое свечение
  if (veg.type.startsWith('golden_')) {
    const glow = ctx.createRadialGradient(
      0,
      0,
      circleRadius! * 0.5,
      0,
      0,
      circleRadius! * 1.5,
    );
    glow.addColorStop(0, 'rgba(255, 214, 0, 0)');
    glow.addColorStop(1, 'rgba(255, 214, 0, 0.4)');
    ctx.beginPath();
    ctx.arc(0, 0, circleRadius! * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
  }

  ctx.restore();
}

function renderChainLine(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  isValid: boolean, // chain.length >= 3
) {
  if (points.length < 2) return;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    // Плавная кривая через точки
    const prev = points[i - 1];
    const curr = points[i];
    const mx = (prev.x + curr.x) / 2;
    const my = (prev.y + curr.y) / 2;
    ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
  }

  ctx.strokeStyle = isValid ? '#4CAF50' : '#9E9E9E';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash(isValid ? [] : [8, 4]);
  // Эффект стебля: тёмный контур + светлый центр
  ctx.shadowColor = isValid ? 'rgba(76, 175, 80, 0.5)' : 'transparent';
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.restore();
}
```

---

## ЧАСТЬ 7: ЭФФЕКТЫ УНИЧТОЖЕНИЯ (Fruit Ninja стиль)

```typescript
// features/basket-game/lib/effectsCanvas.ts

export function spawnMatchEffect(
  particles: EffectParticle[],
  chain: VegetableBody[],
): EffectParticle[] {
  const newParticles: EffectParticle[] = [];

  for (const veg of chain) {
    const { x, y } = veg.matterBody.position;
    const config = VEGETABLE_CONFIGS[veg.type];

    // 4–6 кусков овоща
    for (let i = 0; i < 5; i++) {
      const angle = ((Math.PI * 2) / 5) * i + Math.random() * 0.5;
      const speed = 3 + Math.random() * 4;
      newParticles.push({
        id: `chunk-${Date.now()}-${i}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        color: config.color,
        size: 8 + Math.random() * 8,
        alpha: 1,
        type: 'chunk',
        lifetime: 40,
        age: 0,
      });
    }

    // 6–8 брызг сока
    for (let i = 0; i < 7; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5;
      newParticles.push({
        id: `juice-${Date.now()}-${i}`,
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: config.color,
        size: 3 + Math.random() * 4,
        alpha: 0.9,
        type: 'juice',
        lifetime: 30,
        age: 0,
      });
    }

    // Звёздочки для золотых
    if (veg.type.startsWith('golden_')) {
      for (let i = 0; i < 8; i++) {
        const angle = ((Math.PI * 2) / 8) * i;
        newParticles.push({
          id: `star-${Date.now()}-${i}`,
          x,
          y,
          vx: Math.cos(angle) * 5,
          vy: Math.sin(angle) * 5 - 4,
          color: '#FFD600',
          size: 10,
          alpha: 1,
          type: 'star',
          lifetime: 50,
          age: 0,
        });
      }
    }
  }

  return [...particles, ...newParticles];
}

export function updateParticles(particles: EffectParticle[]): EffectParticle[] {
  return particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.25, // гравитация
      vx: p.vx * 0.96, // затухание X
      alpha: p.alpha * (1 - p.age / p.lifetime) * 1.02,
      age: p.age + 1,
    }))
    .filter((p) => p.age < p.lifetime && p.alpha > 0.01);
}

export function renderParticles(
  ctx: CanvasRenderingContext2D,
  particles: EffectParticle[],
) {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);

    if (p.type === 'chunk') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.roundRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size, 3);
      ctx.fill();
    } else if (p.type === 'juice') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(
        p.x,
        p.y,
        p.size,
        p.size * 0.6,
        Math.atan2(p.vy, p.vx),
        0,
        Math.PI * 2,
      );
      ctx.fill();
    } else if (p.type === 'star') {
      drawStar(ctx, p.x, p.y, 5, p.size, p.size * 0.4);
      ctx.fillStyle = p.color;
      ctx.fill();
    }

    ctx.restore();
  }
}
```

---

## ЧАСТЬ 8: БУСТЕРЫ

```typescript
// features/basket-game/model/types.ts — действия бустеров

// В useGameEngine реализовать функцию:
function activateBooster(
  type: BoosterType,
  targetVegetableId?: string, // нужен для skewer и watering
): void {
  switch (type) {
    case 'blender': {
      // 1. Игрок выбирает тип овоща (UI: показать список типов в лукошке)
      // 2. Все овощи этого типа — эффект взрыва + remove из engine
      // 3. Очки НЕ начисляются (бустер, не матч)
      // 4. harvestProgress += (count * 2) * progressPerUnit
      // 5. booster.blender -= 1
      break;
    }

    case 'skewer': {
      // 1. targetVegetableId — конкретный объект, на который нажали
      // 2. Анимация шампура (спрайт пронизывает объект сверху вниз)
      // 3. Remove body из engine
      // 4. Эффект уничтожения (меньше частиц, чем у матча)
      // 5. booster.skewer -= 1
      break;
    }

    case 'watering': {
      // 1. targetVegetableId — центральный объект
      // 2. Найти всех соседей в радиусе 120px
      // 3. Сменить их type на тип центрального
      // 4. Обновить спрайты (визуально)
      // 5. НЕ удалять из engine — только изменить тип
      // 6. Анимация: водяной сплеск поверх Canvas
      // 7. booster.watering -= 1
      break;
    }

    case 'rake': {
      // 1. Применить случайный импульс к каждому телу:
      //    Matter.Body.applyForce(body, body.position, {
      //      x: (Math.random() - 0.5) * 0.05,
      //      y: -(Math.random() * 0.05)
      //    })
      // 2. Анимация граблей (спрайт проходит по лукошку)
      // 3. booster.rake -= 1
      break;
    }

    case 'secateur': {
      // Второй шанс при lose_overflow
      // 1. Найти все тела, чья position.y < overflowLineY
      // 2. Удалить их с эффектом сечения (анимация лезвия)
      // 3. Сбросить таймер переполнения
      // 4. Вернуть статус 'playing'
      // 5. booster.secateur -= 1
      break;
    }

    case 'extraMoves': {
      // Второй шанс при lose_moves
      // 1. movesLeft += 5
      // 2. Вернуть статус 'playing'
      // 3. booster.extraMoves -= 1
      break;
    }
  }
}
```

---

## ЧАСТЬ 9: HUD (ИГРОВОЙ ИНТЕРФЕЙС)

```tsx
// features/basket-game/ui/GameHUD.tsx

// Верхняя панель (position: absolute, top: 0):
// ┌─────────────────────────────────────────┐
// │  🌿 ХОДЫ: 25   ★ ОЧКИ: 1240   ░░░░▓▓▓ │
// │                              Урожай 67% │
// └─────────────────────────────────────────┘

// Шкала урожая:
// - Зелёный градиент прогресс-бар
// - При 100%: вспышка + shake анимация через CSS keyframes
// - Tooltip: «Соберите ещё X овощей»

// Нижняя панель (position: absolute, bottom: 0):
// ┌────────────────────────────────────────┐
// │  [Блендер×2] [Шампур×1] [Лейка×3] [Грабли×1] │
// └────────────────────────────────────────┘
// При нажатии на бустер — подсветить, переключить режим курсора

// Линия переполнения:
// - Горизонтальная красная пунктирная линия
// - При приближении овощей — мигание (CSS animation blink, 0.5s interval)
// - Таймер 3с отображается рядом с линией
```

---

## ЧАСТЬ 10: ДЕСКТОПНЫЙ РЕДАКТОР УРОВНЕЙ

```tsx
// widgets/level-editor/ui/LevelEditor.tsx
// Только для desktop (min-width: 1024px)
// Layout: flex row
// Левая колонка (400px): конфигурация
// Правая колонка: превью лукошка

// ─── ЛЕВАЯ ПАНЕЛЬ ─────────────────────────

// 1. Выбор уровня
<LevelSelector>
  <select value={selectedLevel} onChange={...}>
    {LEVELS.map(l => <option key={l.id}>{l.name}</option>)}
  </select>
  <button onClick={generateLevel}>⚡ Авто-генерация</button>
  <button onClick={saveLevel}>💾 Сохранить</button>
  <button onClick={exportLevels}>📥 Экспорт JSON</button>
</LevelSelector>

// 2. Попытки (editable)
<AttemptsCounter
  value={attempts}        // default: 100
  onChange={setAttempts}  // число от 1 до 999
/>
// Рендер: input[type=number] + кнопки +/- + label

// 3. Параметры уровня
<LevelConfigForm config={currentLevel} onChange={updateLevel}>
  // movesLimit: input[type=range] 5..50 + число
  // spawnInterval: input[type=range] 400..1500ms
  // harvestGoal: input[type=range] 50..100%
  // goldenChance: input[type=range] 0..20%

  // Типы овощей (checkboxes):
  // ✅ Томат ✅ Огурец ✅ Перец ☐ Баклажан ☐ Лук ☐ Морковь

  // Веса спавна (sliders для каждого активного типа):
  // Томат [===----] 60%   Огурец [==-----] 40%

  // Блокеры (toggles):
  // Арбуз: ON/OFF   Тыква: ON/OFF   Лёд: ON/OFF   Камни: ON/OFF

  // Стартовые объекты в лукошке:
  // [+ Добавить] список: тип + количество

  // Доступные бустеры (checkboxes)
  // Стартовый инвентарь бустеров (number inputs)
</LevelConfigForm>

// ─── ПРАВАЯ ПАНЕЛЬ ─────────────────────────

// Превью лукошка — ЖИВОЕ:
// Запускает Matter.js с текущим конфигом
// Кнопки:
//   [▶ Запустить превью]  — включить спавн и физику
//   [⏹ Стоп]              — остановить
//   [🔄 Сбросить]          — очистить лукошко
// Счётчик объектов в корзине: «Объектов: 14»
// Индикатор текущей нагруженности (% заполнения)
```

---

## ЧАСТЬ 11: МОДАЛЬНЫЕ ОКНА

```
ModalWin:
- Заголовок: «Урожай собран! 🌿»
- Анимация: 3 звезды появляются последовательно (CSS stagger)
- Итого очков: анимированный count-up
- Получен: пакетик семян (если шкала была заполнена)
- Кнопки: «Следующий уровень» / «Переиграть»

ModalLose (lose_moves):
- Заголовок: «Ходы закончились»
- Прогресс шкалы (показать сколько набрано)
- Кнопки: [+5 ходов (N)] / [Переиграть] / [На главную]
- Если booster.extraMoves > 0 — кнопка активна

ModalLose (lose_overflow):
- Заголовок: «Лукошко переполнено!»
- Анимация Выгодень (грустный)
- Кнопки: [Секатор (N)] / [Переиграть] / [На главную]
- Если booster.secateur > 0 — кнопка активна

ModalBoosterSelect (для Блендера):
- Показать все уникальные типы овощей в текущем лукошке
- Тап на тип → активировать блендер
```

---

## ЧАСТЬ 12: ОПТИМИЗАЦИИ

```typescript
// 1. Canvas вместо DOM для игровых объектов — нет React re-render на каждый frame
// 2. Только один requestAnimationFrame loop на всю игру
// 3. Спрайты загружать через ImageBitmap API (быстрее чем HTMLImageElement)
// 4. Matter.js Runner с фиксированным timestep (1000/60)
// 5. Объектный пул для EffectParticle — не создавать новые объекты каждый frame
// 6. Lazy import самого game widget:
//    const GameWidget = dynamic(() => import('@/features/basket-game'), { ssr: false })
// 7. Звуки через Howler.js sprite (один файл, несколько звуков)
// 8. Дебаунс для onChange в редакторе уровней (300мс)
// 9. useMemo для levelConfig пересчёта только при смене id уровня
// 10. Физический движок останавливается (Runner.stop) когда статус !== 'playing'

// Оценка нагрузки:
// ~20 объектов в лукошке × 60fps = 1200 позиций/сек → Canvas справляется
// Matter.js с 20–30 телами — производительно даже на бюджетных Android
```

---

## ЧАСТЬ 13: ЗВУКИ

```
Файл: /public/sounds/game-sprites.mp3 (sprite)

Карта спрайтов:
- 'spawn'       [0,    300]   — тихий «плюх» падения
- 'select'      [400,  150]   — тик при добавлении в цепочку
- 'match_small' [600,  500]   — уничтожение 3-4 объектов
- 'match_big'   [1200, 700]   — уничтожение 5+ (комбо)
- 'golden'      [2000, 800]   — золотой овощ в цепочке
- 'blocker_hit' [2900, 400]   — попытка тронуть замороженный/камень
- 'overflow_warn' [3400, 600] — мигание красной линии
- 'win'         [4100, 1200]  — победа уровня
- 'lose'        [5400, 900]   — проигрыш
- 'booster'     [6400, 500]   — активация бустера
- 'seed_packet' [7000, 600]   — получение пакетика семян
```

---

## ЧАСТЬ 14: SCSS ПЕРЕМЕННЫЕ И СТИЛЬ

```scss
// shared/styles/_variables.scss

// Корпоративные цвета Магнит
$magnit-green: #1a6b3c;
$magnit-green-mid: #2e7d52;
$magnit-green-lt: #43a047;
$magnit-yellow: #ffd600;
$magnit-red: #d32f2f;

// Игровые
$basket-brown: #795548;
$overflow-red: #ef5350;
$combo-gold: #ffd600;
$chain-green: #66bb6a;
$frozen-blue: #90caf9;

// Мобайл
$game-canvas-width: min(100vw, 420px);
$game-canvas-height: min(100vh, 900px);
$hud-height: 72px;
$booster-panel-h: 80px;
$canvas-play-height: calc(
  #{$game-canvas-height} - #{$hud-height} - #{$booster-panel-h}
);
```

---

## ЧЕКЛИСТ РЕАЛИЗАЦИИ

### Обязательно (MVP)

- [ ] Физика Matter.js: лукошко, спавн, гравитация
- [ ] Touch drag: соединение линией минимум 3 одинаковых
- [ ] Стебель-линия на Canvas во время drag
- [ ] Эффект уничтожения Fruit Ninja (частицы + сок)
- [ ] Линия переполнения с 3-сек таймером
- [ ] Счётчик ходов, очки, шкала урожая
- [ ] Все 4 бустера (блендер, шампур, лейка, грабли)
- [ ] Секатор и +5 ходов (второй шанс)
- [ ] Арбуз/тыква как блокеры с повышенной массой
- [ ] ModalWin / ModalLose_moves / ModalLose_overflow
- [ ] Генератор 60 уровней
- [ ] Редактор уровней (десктоп, левая/правая панель)
- [ ] Попытки — поле редактируемое, default 100

### Важно

- [ ] Лёд — замораживает объекты, размораживается от соседнего матча
- [ ] Камни — не матчатся, только бустеры
- [ ] Золотые овощи — x2 очков, золотые частицы
- [ ] Персонаж Выгодень — idle/happy/sad спрайты на краю экрана
- [ ] Combo-текст при 5+ объектах в цепочке
- [ ] Звуковые эффекты через Howler.js sprite
- [ ] Предзаполнение лукошка для Hard уровней (51+)

### Желательно

- [ ] Отмена последнего объекта drag'ом назад
- [ ] Пульсирующий glow у золотых
- [ ] Haptic feedback navigator.vibrate() на матч
- [ ] Экспорт конфига уровней в JSON из редактора
- [ ] Живое превью в редакторе с запуском физики

```

```
