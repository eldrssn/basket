import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';

export const BASKET_CENTER_X = GAME_WIDTH / 2;
export const BASKET_TOP_Y = GAME_HEIGHT * 0.405;
export const BASKET_INNER_WIDTH = GAME_WIDTH - 64;
export const BASKET_RADIUS = BASKET_INNER_WIDTH / 2;
export const BASKET_ARC_CENTER_Y = GAME_HEIGHT * 0.7;
export const BASKET_ARC_START_Y = BASKET_ARC_CENTER_Y;
export const BASKET_BOTTOM_Y = BASKET_ARC_CENTER_Y + BASKET_RADIUS;
export const BASKET_WALL_THICKNESS = 10;
export const BASKET_SEGMENTS = 24;
export const BASKET_RIM_HEIGHT = 40;
export const BASKET_ARCH_GAP = 170; // ширина дыры в центре арки
export const BASKET_ARCH_SEGMENTS = 14;
export const BASKET_FUNNEL_TOP_Y = -200; // верхняя граница вертикальных стенок воронки

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
    right: [
      ...outline.bottomArc.slice().reverse(),
      ...outline.rightWall.slice().reverse(),
    ],
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

// Арка над корзиной: два дуговых сегмента с дырой в центре.
// Оба сегмента — часть окружности радиуса BASKET_RADIUS с центром в (BASKET_CENTER_X, BASKET_TOP_Y).
// Левый сегмент: от левой стенки до левого края дыры.
// Правый сегмент: от правого края дыры до правой стенки.
export function getBasketArchPoints(): {
  left: BasketPoint[];
  right: BasketPoint[];
} {
  const R = BASKET_RADIUS;
  const cx = BASKET_CENTER_X;
  const cy = BASKET_TOP_Y;
  const gapHalf = BASKET_ARCH_GAP / 2;

  // Угол от горизонтали, где x = cx ± gapHalf
  const gapAngle = Math.acos(gapHalf / R);
  const leftGapAngle = Math.PI - gapAngle;

  const left: BasketPoint[] = [];
  const right: BasketPoint[] = [];

  for (let i = 0; i <= BASKET_ARCH_SEGMENTS; i++) {
    const t = i / BASKET_ARCH_SEGMENTS;

    // Левая дуга: от угла π (левая стенка) до leftGapAngle (левый край дыры)
    const la = Math.PI - t * (Math.PI - leftGapAngle);
    left.push({ x: cx + R * Math.cos(la), y: cy - R * Math.sin(la) });

    // Правая дуга: от gapAngle (правый край дыры) до 0 (правая стенка)
    const ra = gapAngle * (1 - t);
    right.push({ x: cx + R * Math.cos(ra), y: cy - R * Math.sin(ra) });
  }

  return { left, right };
}

// Вертикальные стенки от кончиков арки вверх до верха игрового поля.
// Ограничивают зону спавна — элементы не могут улететь в стороны.
export function getBasketArchFunnelPoints(): {
  left: [BasketPoint, BasketPoint];
  right: [BasketPoint, BasketPoint];
} {
  const R = BASKET_RADIUS;
  const cx = BASKET_CENTER_X;
  const cy = BASKET_TOP_Y;
  const gapHalf = BASKET_ARCH_GAP / 2;

  const gapAngle = Math.acos(gapHalf / R);
  const leftGapAngle = Math.PI - gapAngle;

  const leftTip: BasketPoint = {
    x: cx + R * Math.cos(leftGapAngle),
    y: cy - R * Math.sin(leftGapAngle),
  };
  const rightTip: BasketPoint = {
    x: cx + R * Math.cos(gapAngle),
    y: cy - R * Math.sin(gapAngle),
  };

  return {
    left: [{ x: leftTip.x, y: BASKET_FUNNEL_TOP_Y }, leftTip],
    right: [rightTip, { x: rightTip.x, y: BASKET_FUNNEL_TOP_Y }],
  };
}
