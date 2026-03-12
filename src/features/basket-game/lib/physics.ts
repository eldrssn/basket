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

/**
 * Creates a parabolic basket from multiple angled segments.
 * The parabola runs from (cx - width/2, cy - height/2) at the top
 * down to (cx, cy + height/2) at the bottom vertex,
 * and back up to (cx + width/2, cy - height/2).
 */
export function createBasketBodies(
  cx: number,
  cy: number,
  width: number,
  height: number,
): Matter.Body[] {
  const wallThickness = 10;
  const segments = 12; // segments per side (left + right)

  const wallOpts: Matter.IBodyDefinition = {
    isStatic: true,
    friction: 0.8,
    restitution: 0.15,
    label: 'basket-wall',
  };

  const bodies: Matter.Body[] = [];

  // Parabola: y(x) = a*(x-cx)^2 + bottomY
  // At x = cx ± width/2, y = topY = cy - height/2
  // At x = cx, y = bottomY = cy + height/2
  // a = (topY - bottomY) / (width/2)^2
  const halfW = width / 2;
  const topY = cy - height / 2;
  const bottomY = cy + height / 2;
  const a = (topY - bottomY) / (halfW * halfW);

  // Generate points along the parabola from left to right
  const totalPoints = segments * 2 + 1;
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= totalPoints; i++) {
    const x = cx - halfW + (i / totalPoints) * width;
    const dx = x - cx;
    const y = a * dx * dx + bottomY;
    points.push({ x, y });
  }

  // Create a rectangle segment between each pair of consecutive points
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    const seg = Matter.Bodies.rectangle(midX, midY, len + 2, wallThickness, {
      ...wallOpts,
      angle,
    });
    bodies.push(seg);
  }

  // Left wall extending above the parabola top
  const leftTopX = cx - halfW;
  const leftWall = Matter.Bodies.rectangle(
    leftTopX,
    topY - height * 0.3,
    wallThickness,
    height * 0.6,
    wallOpts,
  );
  bodies.push(leftWall);

  // Right wall extending above the parabola top
  const rightTopX = cx + halfW;
  const rightWall = Matter.Bodies.rectangle(
    rightTopX,
    topY - height * 0.3,
    wallThickness,
    height * 0.6,
    wallOpts,
  );
  bodies.push(rightWall);

  return bodies;
}
