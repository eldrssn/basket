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
  | 'golden_cucumber' // золотые
  | 'beetroot'
  | 'apple'
  | 'orange'
  | 'strawberry'
  | 'blueberry';

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
  beetroot: {
    type: 'beetroot',
    radius: 26,
    mass: 0.95,
    restitution: 0.25,
    friction: 0.6,
    frictionAir: 0.01,
    spritePath: '/game/beetroot.png',
    color: '#B71C1C',
    isBlocker: false,
    isGolden: false,
    pointValue: 15,
  },
  apple: {
    type: 'apple',
    radius: 28,
    mass: 1.0,
    restitution: 0.3,
    friction: 0.6,
    frictionAir: 0.01,
    spritePath: '/game/apple.png',
    color: '#8BC34A',
    isBlocker: false,
    isGolden: false,
    pointValue: 15,
  },
  orange: {
    type: 'orange',
    radius: 29,
    mass: 1.05,
    restitution: 0.3,
    friction: 0.6,
    frictionAir: 0.01,
    spritePath: '/game/orange.png',
    color: '#FF9800',
    isBlocker: false,
    isGolden: false,
    pointValue: 15,
  },
  strawberry: {
    type: 'strawberry',
    radius: 22,
    mass: 0.7,
    restitution: 0.2,
    friction: 0.65,
    frictionAir: 0.01,
    spritePath: '/game/strawberry.png',
    color: '#E91E63',
    isBlocker: false,
    isGolden: false,
    pointValue: 15,
  },
  blueberry: {
    type: 'blueberry',
    radius: 18,
    mass: 0.5,
    restitution: 0.2,
    friction: 0.7,
    frictionAir: 0.01,
    spritePath: '/game/blueberry.png',
    color: '#3F51B5',
    isBlocker: false,
    isGolden: false,
    pointValue: 15,
  },
};

export const VEGETABLE_LABELS: Record<string, string> = {
  tomato: 'П',
  cucumber: 'О',
  pepper: 'П',
  eggplant: 'Б',
  onion: 'Л',
  carrot: 'М',
  beetroot: 'С',
  apple: 'Я',
  orange: 'А',
  strawberry: 'К',
  blueberry: 'Г',
  watermelon: 'А',
  pumpkin: 'Т',
  golden_tomato: 'П',
  golden_cucumber: 'О',
};

export const VEGETABLE_NAMES_RU: Record<string, string> = {
  tomato: 'Помидор',
  cucumber: 'Огурец',
  pepper: 'Перец',
  eggplant: 'Баклажан',
  onion: 'Лук',
  carrot: 'Морковь',
  beetroot: 'Свекла',
  apple: 'Яблоко',
  orange: 'Апельсин',
  strawberry: 'Клубника',
  blueberry: 'Голубика',
};
