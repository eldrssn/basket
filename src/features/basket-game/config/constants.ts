// Fixed logical game space dimensions
export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 844;

// Match detection: extra px beyond the sum of radii to consider items neighbors
export const NEIGHBOR_THRESHOLD_EXTRA_PX = 35;

// Particle pool
export const MAX_PARTICLES = 300;
export const PARTICLE_GRAVITY = 0.25;
export const PARTICLE_VX_DAMPING = 0.96;

// Particle emission: chunk (solid pieces)
export const CHUNK_COUNT = 5;
export const CHUNK_SPEED_MIN = 3;
export const CHUNK_SPEED_RANGE = 4;
export const CHUNK_SIZE_MIN = 8;
export const CHUNK_SIZE_RANGE = 8;
export const CHUNK_LIFETIME = 40;

// Particle emission: juice (liquid drops)
export const JUICE_COUNT = 7;
export const JUICE_SPEED_MIN = 1;
export const JUICE_SPEED_RANGE = 5;
export const JUICE_SIZE_MIN = 3;
export const JUICE_SIZE_RANGE = 4;
export const JUICE_LIFETIME = 30;

// Particle emission: star (golden items)
export const STAR_COUNT = 8;
export const STAR_SPEED = 5;
export const STAR_SIZE = 10;
export const STAR_LIFETIME = 50;

// Spawner
export const SPAWN_PADDING = 40;
export const RESPAWN_STAGGER_MS = 120;
export const INITIAL_SPAWN_STAGGER_MS = 100;
