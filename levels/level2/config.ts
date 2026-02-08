
export const LEVEL2_CONFIG = {
  GRAVITY: 0.8,   // Увеличена для резкости (было 0.7)
  JUMP_FORCE: -14, // Высота прыжка ~122px. Комфортно для ступенек в 100px
  MOVE_SPEED: 6,
  FRICTION: 0.8,
  
  // Размеры игрока
  PLAYER_WIDTH: 30,
  PLAYER_HEIGHT: 60,
  PLAYER_MAX_HP: 3, // Health Points
  
  // Настройки мира
  FLOOR_HEIGHT: 60,
  LEVEL_LENGTH: 21600, // 1 минута при скорости 6 (6*60*60)
  
  // Цвета "Корпоративный офис"
  COLORS: {
    BACKGROUND_TOP: '#e2e8f0', 
    BACKGROUND_BOTTOM: '#94a3b8',
    FLOOR: '#1e293b', 
    PLATFORM: '#334155', 
    PLATFORM_TOP: '#cbd5e1', 
    
    // Цвета мебели
    FURNITURE_BROWN_DARK: '#4a1905', 
    FURNITURE_BROWN_BASE: '#7c2d12', 
    FURNITURE_BROWN_LIGHT: '#b45309', 
    
    PLAYER: '#facc15', 
    OBSTACLE: '#ef4444' 
  }
};

export const BOSS_CONFIG = {
  HP: 5,
  ATTACK_INTERVAL_MIN: 3000, // 3 seconds
  ATTACK_INTERVAL_MAX: 5000, // 5 seconds
  PROJECTILE_SPEED: 6.3, // Decreased by 30% (was 9)
  PROJECTILE_WIDTH: 36,  // Increased by 50% (was 24)
  PROJECTILE_HEIGHT: 30, // Increased by 50% (was 20)
  BOUNCE_FORCE_X: -25, // Increased from -15 to -25
  BOUNCE_FORCE_Y: -10,  // Increased from -6 to -10
  
  // Audio Mechanic
  MIC_THRESHOLD: 30, // 0-255. 30 is roughly 50% of the visual scale (max ~60)
  DAMAGE_COOLDOWN: 120 // Frames (2 seconds) between hits
};

export const SECURITY_CONFIG = {
  WIDTH: 45, // Шире игрока (45 vs 30)
  HEIGHT: 70, // Выше игрока (70 vs 60)
  RUN_SPEED: 5.0, 
  PATROL_SPEED: 1.5, // Медленная ходьба
  PATROL_RADIUS_OPTIONS: [50, 75, 100], // Варианты радиуса патруля (±px)
  TRIGGER_DISTANCE_OPTIONS: [450, 550, 650], // Варианты дистанции обнаружения (px)
  SPAWN_MIN_DIST: 400, // Уменьшено с 800 (позволяет спавнить чаще и ближе)
  SPAWN_MAX_DIST: 1000, // Уменьшено с 1500 (форсирует спавн раньше)
  MAX_ON_SCREEN: 2
};
