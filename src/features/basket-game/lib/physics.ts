import Matter from 'matter-js';
import {
  BASKET_RIM_HEIGHT,
  BASKET_WALL_THICKNESS,
  getBasketOutlinePoints,
} from './basket';

export interface PhysicsConfig {
  canvasWidth: number;
  canvasHeight: number;
  gravity: number; // default: 1.5
}

export function initPhysicsEngine(config: PhysicsConfig) {
  const engine = Matter.Engine.create({
    gravity: { x: 0, y: config.gravity },
    positionIterations: 10,
    velocityIterations: 8,
  });

  return { engine };
}

export function createBasketBodies(
  _cx: number,
  _cy: number,
  _width: number,
  _height: number,
): Matter.Body[] {
  const wallOpts: Matter.IBodyDefinition = {
    isStatic: true,
    friction: 0.8,
    restitution: 0.15,
    label: 'basket-wall',
  };

  const bodies: Matter.Body[] = [];
  const { leftWall, bottomArc, rightWall } = getBasketOutlinePoints();

  const createSegment = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    bodies.push(
      Matter.Bodies.rectangle(midX, midY, len + 2, BASKET_WALL_THICKNESS, {
        ...wallOpts,
        angle,
      }),
    );
  };

  const createPathSegments = (points: { x: number; y: number }[]) => {
    for (let i = 0; i < points.length - 1; i++) {
      createSegment(points[i], points[i + 1]);
    }
  };

  createPathSegments(leftWall);
  createPathSegments(bottomArc);
  createPathSegments(rightWall);

  const leftTop = leftWall[0];
  const rightTop = rightWall[0];
  bodies.push(
    Matter.Bodies.rectangle(
      leftTop.x,
      leftTop.y - BASKET_RIM_HEIGHT / 2,
      BASKET_WALL_THICKNESS,
      BASKET_RIM_HEIGHT,
      wallOpts,
    ),
  );
  bodies.push(
    Matter.Bodies.rectangle(
      rightTop.x,
      rightTop.y - BASKET_RIM_HEIGHT / 2,
      BASKET_WALL_THICKNESS,
      BASKET_RIM_HEIGHT,
      wallOpts,
    ),
  );

  return bodies;
}
