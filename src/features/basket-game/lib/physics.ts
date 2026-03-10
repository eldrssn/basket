import Matter from 'matter-js';

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

  const runner = Matter.Runner.create();

  return { engine, runner };
}

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
