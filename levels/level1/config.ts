
export const LEVEL1_CONFIG = {
  LANE_COUNT: 5,
  LANE_WIDTH: 80,
  ROAD_WIDTH: 400,
  PLAYER_WIDTH: 40,
  PLAYER_HEIGHT: 70,
  TRAFFIC_WIDTH: 40,
  TRAFFIC_HEIGHT: 70,
  INITIAL_SPEED: 8,
  MIN_SPEED: 4,
  MAX_SPEED: 14,
  TRAFFIC_BASE_SPEED: 5,
  ACCELERATION: 0.08, 
  BRAKING: 0.15, 
  HIGH_SPEED_BRAKING_MULT: 2.5, 
  FRICTION: 0.06,
  SPAWN_RATE: 0.05,  
  MIN_SPAWN_GAP: 220, 
  MIN_TRAFFIC_COUNT: 5,
  MAX_TRAFFIC_COUNT: 12,
  WIN_DISTANCE: 5000, 
  COLORS: {
    // Зимняя ночь (Реалистичная палитра)
    SNOW_BG: '#0f172a', // Очень темная земля/ночь (фон)
    
    // Градиент снега
    SNOW_NEAR: '#cbd5e1', // Светлый снег (Slate-300) у дороги
    SNOW_FAR: '#020617',  // Темнота вдали от дороги
    
    ROAD: '#334155', // Светлый асфальт (Slate-700) для контраста следов
    MARKINGS: '#94a3b8', // Светлая разметка
    SKID_MARK: '#000000', 
    SMOKE: 'rgba(220, 230, 240, 0.6)', 
    PLAYER: '#facc15', 
    INDICATOR: '#fbbf24',
    BRAKE_LIGHT: '#ff0000',
    BRAKE_GLOW: 'rgba(220, 38, 38, 0.6)',
    TRAFFIC: [
      '#ef4444', 
      '#3b82f6', 
      '#10b981', 
      '#f97316', 
      '#8b5cf6', 
      '#06b6d4', 
      '#f8fafc' 
    ],
    BACKGROUND: '#020617' 
  },
  PHRASES: {
    NEAR_MISS: ['Ой!', 'Мамочки!', 'Тише!', 'Фух!', 'Пронесло!', 'Ааа!'],
    WALL_BUMP: ['Ай!', 'Бампер!', 'Аккуратнее!', 'Больно!', 'Моя машина!', 'Эй!']
  }
};
