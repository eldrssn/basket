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

  return { engine };
}

export function createBasketBodies(
  cx: number,
  cy: number,
  width: number,
  height: number,
): Matter.Body[] {
  const wallThickness = 20;

  const wallOpts: Matter.IBodyDefinition = {
    isStatic: true,
    friction: 0.8,
    restitution: 0.2,
    label: 'basket-wall',
  };

  // Bottom: top collision surface aligns with visual inner floor (cy + height/2 - wallThickness)
  // Center Y = innerFloor + wallThickness/2 = cy + height/2 - wallThickness/2
  const bottom = Matter.Bodies.rectangle(
    cx,
    cy + height / 2 - wallThickness / 2,
    width,
    wallThickness,
    { ...wallOpts, chamfer: { radius: [20, 20, 0, 0] } },
  );

  const leftWall = Matter.Bodies.rectangle(
    cx - width / 2 + wallThickness / 2,
    cy,
    wallThickness,
    height,
    wallOpts,
  );

  const rightWall = Matter.Bodies.rectangle(
    cx + width / 2 - wallThickness / 2,
    cy,
    wallThickness,
    height,
    wallOpts,
  );

  return [bottom, leftWall, rightWall];
}
