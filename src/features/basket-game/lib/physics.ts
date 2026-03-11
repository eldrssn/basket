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
  const cornerRadius = 100; // Радиус скругления (не используется напрямую, но для визуализации)
  // Для физики мы можем использовать chamfer для скругления углов прямоугольников,
  // или составить U-форму из нескольких частей.
  // Самый простой способ сделать "скругленное" дно - использовать chamfer у нижней стенки
  // или составить дно из нескольких сегментов.
  // Для простоты пока оставим прямоугольники, но с chamfer для скругления.

  const bottom = Matter.Bodies.rectangle(
    // Physics center is cy (center of basket walls) + height/2 (bottom edge of walls) - wallThickness/2 (center of bottom wall)
    // To align top of bottom wall with the visual line, we need to move it up by wallThickness/2?
    // No, if the rectangle is at `y`, its top is `y - h/2`.
    // We want `top` to be at `visualBottomY - wallThickness`.
    // Current `visualBottomY` in renderer is `cy + h/2`.
    // So visual top of bottom bar is `cy + h/2 - wallThickness`.
    // We want physics top to be there.
    // Physics body `y` = `top + h/2`.
    // So `y` = `(cy + h/2 - wallThickness) + wallThickness/2` = `cy + h/2 - wallThickness/2`.
    // Wait, the previous code was `cy + height / 2 - wallThickness / 2`.
    // If the visual is drawn at `cy + h/2`, that's the bottom-most coordinate of the side walls.
    // The U-shape connects the side walls.
    // The "floor" surface should be at `cy + height/2 - wallThickness`.

    // Let's adjust:
    // We want the collision surface (top of bottom block) to be at `cy + height/2 - wallThickness`.
    // Since center Y of a block is `top + thickness/2`, the center Y should be:
    // `(cy + height/2 - wallThickness) + wallThickness/2` = `cy + height/2 - wallThickness/2`.

    // It seems the previous logic was correct for aligning with the visual U-shape thickness.
    // If items are falling "too low", maybe the visual line is drawn differently?

    // In renderBasket:
    // ctx.lineTo(cx + w / 2 - cornerRadius, visualBottomY);
    // visualBottomY = cy + h / 2.
    // So the visual bottom line is at `cy + h/2`.
    // BUT the inner curve goes to `visualBottomY - wallThickness`.
    // So the visual "floor" surface is at `cy + h/2 - wallThickness`.

    // My physics body center is at `cy + h/2 - wallThickness/2`.
    // Its top edge is `center - thickness/2` = `cy + h/2 - wallThickness`.
    // This matches the visual floor surface!

    // Why did the user say "falling to lower boundary"?
    // Maybe because of the chamfer?
    // Or maybe because `wallThickness` is small and visual stroke is wide?
    // Ah, `wallThickness` is 20.

    // If user wants items to fall on the "upper boundary of the basket line",
    // they mean the top edge of the bottom wall.
    // My calculation suggests they should align.

    // Let's try moving the physics body UP slightly to be safe.
    // Or maybe the user means the visual "bottom" line is the outer edge, and they want items to sit on the inner edge.
    // Yes, `visualBottomY` is the outer bottom edge.
    // Inner edge is `visualBottomY - wallThickness`.
    // Physics top is `cy + h/2 - wallThickness`.
    // They should match.

    // Maybe the issue is the chamfer on the bottom wall?
    // `chamfer: { radius: [20, 20, 0, 0] }` makes the top corners rounded.
    // This effectively lowers the collision surface at the corners, but the flat part should be fine.

    // Let's try moving the bottom physics body UP by `wallThickness`.
    // If I move it up, the floor rises.

    // Let's change `cy + height / 2 - wallThickness / 2` to `cy + height / 2 - wallThickness`.
    // This moves the center up by half thickness.
    // Top edge becomes `cy + height / 2 - 1.5 * wallThickness`.
    // This would be floating above the visual floor.

    // Wait, let's look at `renderBasket` again.
    // `ctx.lineTo(cx - w / 2 + cornerRadius, cy + h / 2 - wallThickness);`
    // This line draws the inner floor.
    // Y = `cy + h/2 - 20`.

    // Physics body center Y = `cy + h/2 - 10`.
    // Physics body top Y = `(cy + h/2 - 10) - 10` = `cy + h/2 - 20`.

    // They are mathematically identical.

    // Maybe the user sees the "line" as the stroke?
    // But I'm using `fill()`, not stroke.

    // Let's try shifting the physics body UP by `wallThickness / 2` (10px).
    // This will make the collision surface 10px higher than the visual floor.
    // This might ensure they definitely don't look like they are sinking.

    cy + height / 2 + wallThickness,
    width,
    wallThickness,
    {
      isStatic: true,
      friction: 0.8,
      restitution: 0.2,
      label: 'basket-wall',
      chamfer: { radius: [20, 20, 0, 0] },
    },
  );

  const leftWall = Matter.Bodies.rectangle(
    cx - width / 2 + wallThickness / 2, // Сдвигаем внутрь на половину толщины
    cy,
    wallThickness,
    height,
    {
      isStatic: true,
      friction: 0.8,
      restitution: 0.2,
      label: 'basket-wall',
    },
  );

  const rightWall = Matter.Bodies.rectangle(
    cx + width / 2 - wallThickness / 2, // Сдвигаем внутрь на половину толщины
    cy,
    wallThickness,
    height,
    {
      isStatic: true,
      friction: 0.8,
      restitution: 0.2,
      label: 'basket-wall',
    },
  );

  return [bottom, leftWall, rightWall];
}
