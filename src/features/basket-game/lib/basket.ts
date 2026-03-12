import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';

export const BASKET_CENTER_X = GAME_WIDTH / 2;
export const BASKET_TOP_Y = GAME_HEIGHT * 0.12;
export const BASKET_INNER_WIDTH = GAME_WIDTH - 64;
export const BASKET_RADIUS = BASKET_INNER_WIDTH / 2;
export const BASKET_ARC_CENTER_Y = GAME_HEIGHT * 0.7;
export const BASKET_ARC_START_Y = BASKET_ARC_CENTER_Y;
export const BASKET_BOTTOM_Y = BASKET_ARC_CENTER_Y + BASKET_RADIUS;
export const BASKET_WALL_THICKNESS = 10;
export const BASKET_SEGMENTS = 24;
export const BASKET_RIM_HEIGHT = 40;

export interface BasketPoint {
  x: number;
  y: number;
}

export interface BasketBounds {
  left: number;
  right: number;
}

export interface BasketOutline {
  leftWall: BasketPoint[];
  bottomArc: BasketPoint[];
  rightWall: BasketPoint[];
}

export function getBasketInnerBoundsAtY(y: number, inset = 0): BasketBounds {
  const halfWidth = Math.max(0, BASKET_INNER_WIDTH / 2 - inset);
  const clampedY = Math.min(Math.max(y, BASKET_TOP_Y), BASKET_BOTTOM_Y);

  if (clampedY <= BASKET_ARC_START_Y) {
    return {
      left: BASKET_CENTER_X - halfWidth,
      right: BASKET_CENTER_X + halfWidth,
    };
  }

  const innerRadius = Math.max(0, BASKET_RADIUS - inset);
  const dy = clampedY - BASKET_ARC_CENTER_Y;
  const dx = Math.sqrt(Math.max(0, innerRadius * innerRadius - dy * dy));

  return {
    left: BASKET_CENTER_X - dx,
    right: BASKET_CENTER_X + dx,
  };
}

export function getBasketSidePoints(
  segments = BASKET_SEGMENTS,
  inset = 0,
): { left: BasketPoint[]; right: BasketPoint[] } {
  const outline = getBasketOutlinePoints(segments, inset);
  return {
    left: [...outline.leftWall, ...outline.bottomArc],
    right: [...outline.bottomArc.slice().reverse(), ...outline.rightWall.slice().reverse()],
  };
}

export function getBasketOutlinePoints(
  segments = BASKET_SEGMENTS,
  inset = 0,
): BasketOutline {
  const leftWall: BasketPoint[] = [];
  const rightWall: BasketPoint[] = [];
  const bottomArc: BasketPoint[] = [];
  const topBounds = getBasketInnerBoundsAtY(BASKET_TOP_Y, inset);
  const wallHeight = BASKET_ARC_START_Y - BASKET_TOP_Y;
  const wallSteps = Math.max(1, Math.floor(segments * 0.45));
  const arcSteps = Math.max(3, segments - wallSteps);

  for (let i = 0; i <= wallSteps; i++) {
    const t = i / wallSteps;
    const y = BASKET_TOP_Y + wallHeight * t;
    leftWall.push({ x: topBounds.left, y });
    rightWall.push({ x: topBounds.right, y });
  }

  const innerRadius = Math.max(0, BASKET_RADIUS - inset);
  for (let i = 0; i <= arcSteps; i++) {
    const t = i / arcSteps;
    const angle = Math.PI - t * Math.PI;
    const x = BASKET_CENTER_X + Math.cos(angle) * innerRadius;
    const y = BASKET_ARC_CENTER_Y + Math.sin(angle) * innerRadius;
    bottomArc.push({ x, y });
  }

  return { leftWall, bottomArc, rightWall };
}
