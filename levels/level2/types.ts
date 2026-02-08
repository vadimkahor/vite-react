
export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'desk' | 'floor' | 'platform' | 'sofa' | 'armchair' | 'meeting_table' | 'file_cabinet' | 'metal_rack' | 'small_book_shelf' | 'air_conditioner' | 'xerox' | 'vending' | 'electric_box' | 'big_trashcan' | 'book_cabinet' | 'crate';
}

export interface Decoration {
  x: number;
  y: number;
  type: 'window' | 'plant' | 'cooler' | 'computer' | 'papers' | 'phone' | 'coffee' | 'floor_plant' | 'boxes' | 'tv' | 'trashcan' | 'clock' | 'floor_lamp' | 'desk_lamp';
  variant: number; // Обязательное поле для строгого кэширования
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number; // Health Points
  invulnerableTimer: number; // Invincibility frames after hit
  isGrounded: boolean;
  isJumping: boolean;
  isBoosted: boolean; // Флаг для эффекта батута (SOFA/ARMCHAIR)
  facingRight: boolean;
  frameTimer: number; // Для анимации бега
  currentPlatformType: Platform['type'] | null; // Тип платформы, на которой стоит игрок
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'security';
  state: 'idle' | 'patrol' | 'running';
  startX: number;    // Точка, вокруг которой патрулирует
  patrolDir: number; // 1 (вправо) или -1 (влево)
  patrolMaxDist: number; // Радиус патрулирования (±px)
  triggerDistance: number; // Дистанция обнаружения игрока
  vx: number;
  frameTimer: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  rotation: number;
  type: 'paper_stack';
}

export interface Boss {
  x: number;
  y: number;
  width: number;
  height: number;
  variant: number; // 0, 1, 2
  frameTimer: number;
  attackTimer: number;     // Current timer
  timeToNextAttack: number; // Target time for next attack
  
  // NEW FIELDS
  hp: number;
  maxHp: number;
  damagedTimer: number; // Visual flash when hit
  invulnerableTimer: number; // Cooldown between hits from shouting
}

// Эффект скорости (ветер)
export interface SpeedLine {
  id: string;
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  isVertical?: boolean; // Вертикальная линия (для прыжков)
  followPlayer?: boolean; // Если true, X координата привязана к игроку
  offsetX?: number; // Смещение относительно игрока (если followPlayer=true)
}

// Данные для одного здания внутри окна
export interface Building {
  x: number; // relative to window
  width: number;
  height: number;
  litWindows: boolean[][]; // [row][col]
}

// Кэшированный элемент фона (окно с видом на город)
export interface BackgroundElement {
  x: number;
  y: number;
  width: number;
  height: number;
  hasClouds: boolean;
  cloudSeed: number; // Для детерминированной отрисовки облаков
  buildings: Building[];
  cachedCanvas?: HTMLCanvasElement; // OPTIMIZATION: Cache the expensive drawing
}

export interface Level2State {
  player: PlayerState;
  platforms: Platform[];
  decorations: Decoration[];
  enemies: Enemy[]; 
  boss: Boss | null; 
  projectiles: Projectile[]; // New Projectiles array
  lastEnemySpawnX: number; // For spawning logic
  backgroundElements: BackgroundElement[]; // PRE-GENERATED DATA
  speedLines: SpeedLine[]; // Эффекты ветра
  cameraX: number;
  maxCameraX: number; // Tracks the furthest point reached to limit backtracking
  score: number;
  gameTime: number;
  levelLength?: number; // Опционально для витрины
  wasScreaming: boolean; // Tracks previous frame mic input state
}
