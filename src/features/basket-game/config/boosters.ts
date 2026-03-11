import type { BoosterType } from '../model/types';

export interface BoosterConfig {
  type: BoosterType;
  label: string;
  description: string;
  iconSrc: string;
}

export const BOOSTER_CONFIGS: Record<BoosterType, BoosterConfig> = {
  watering: {
    type: 'watering',
    label: 'Лейка',
    description: 'Выбери овощ — все соседи превратятся в его тип!',
    iconSrc: '/game/boosters/watering.png',
  },
  skewer: {
    type: 'skewer',
    label: 'Шампур',
    description: 'Выбери любой объект — он будет удалён с поля.',
    iconSrc: '/game/boosters/skewer.png',
  },
  blender: {
    type: 'blender',
    label: 'Блендер',
    description: 'Выбери тип овоща — все такие овощи исчезнут с поля!',
    iconSrc: '/game/boosters/blender.png',
  },
};

export const BOOSTER_TYPES: BoosterType[] = ['watering', 'skewer', 'blender'];
