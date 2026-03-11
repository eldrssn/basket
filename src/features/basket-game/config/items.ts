import type { ItemType } from '../model/types';

export interface ItemPhysicsConfig {
  type: ItemType;
  label: string;
  radius: number;
  mass: number;
  restitution: number;
  friction: number;
  frictionAir: number;
  color: string;
  spriteSrc: string;
  pointValue: number;
}

export const ITEM_CONFIGS: Record<ItemType, ItemPhysicsConfig> = {
  tomato: {
    type: 'tomato', label: 'Помидор',
    radius: 26, mass: 1.0, restitution: 0.3, friction: 0.6, frictionAir: 0.01,
    color: '#E53935', spriteSrc: '/game/items/tomato.png', pointValue: 3,
  },
  carrot: {
    type: 'carrot', label: 'Морковь',
    radius: 22, mass: 0.8, restitution: 0.2, friction: 0.65, frictionAir: 0.012,
    color: '#FF6F00', spriteSrc: '/game/items/carrot.png', pointValue: 3,
  },
  eggplant: {
    type: 'eggplant', label: 'Баклажан',
    radius: 25, mass: 1.1, restitution: 0.2, friction: 0.7, frictionAir: 0.01,
    color: '#6A1B9A', spriteSrc: '/game/items/eggplant.png', pointValue: 3,
  },
  pepper: {
    type: 'pepper', label: 'Сладкий перец',
    radius: 24, mass: 0.9, restitution: 0.25, friction: 0.65, frictionAir: 0.011,
    color: '#E65100', spriteSrc: '/game/items/pepper.png', pointValue: 3,
  },
  beet: {
    type: 'beet', label: 'Свекла',
    radius: 25, mass: 1.05, restitution: 0.2, friction: 0.7, frictionAir: 0.01,
    color: '#880E4F', spriteSrc: '/game/items/beet.png', pointValue: 3,
  },
  cucumber: {
    type: 'cucumber', label: 'Огурец',
    radius: 23, mass: 0.85, restitution: 0.22, friction: 0.68, frictionAir: 0.011,
    color: '#2E7D32', spriteSrc: '/game/items/cucumber.png', pointValue: 3,
  },
  apple: {
    type: 'apple', label: 'Яблоко',
    radius: 26, mass: 1.0, restitution: 0.28, friction: 0.6, frictionAir: 0.01,
    color: '#C62828', spriteSrc: '/game/items/apple.png', pointValue: 3,
  },
  orange: {
    type: 'orange', label: 'Апельсин',
    radius: 27, mass: 1.1, restitution: 0.32, friction: 0.58, frictionAir: 0.01,
    color: '#E65100', spriteSrc: '/game/items/orange.png', pointValue: 3,
  },
  strawberry: {
    type: 'strawberry', label: 'Клубника',
    radius: 19, mass: 0.7, restitution: 0.25, friction: 0.6, frictionAir: 0.013,
    color: '#C62828', spriteSrc: '/game/items/strawberry.png', pointValue: 3,
  },
  blueberry: {
    type: 'blueberry', label: 'Голубика',
    radius: 15, mass: 0.5, restitution: 0.3, friction: 0.55, frictionAir: 0.015,
    color: '#283593', spriteSrc: '/game/items/blueberry.png', pointValue: 3,
  },
};

export const ITEM_LABELS: Record<ItemType, string> = {
  tomato: 'П',
  carrot: 'М',
  eggplant: 'Б',
  pepper: 'П',
  beet: 'С',
  cucumber: 'О',
  apple: 'Я',
  orange: 'А',
  strawberry: 'К',
  blueberry: 'Г',
};

export const ALL_ITEM_TYPES: ItemType[] = [
  'tomato', 'carrot', 'eggplant', 'pepper', 'beet',
  'cucumber', 'apple', 'orange', 'strawberry', 'blueberry',
];

export function getGoldenRadius(baseType: ItemType): number {
  return ITEM_CONFIGS[baseType].radius + 3;
}
