
import { Entity } from '../../types';

// Сообщение, всплывающее над машиной
export interface FloatingMessage {
  id: string;
  text: string;
  x: number;
  y: number;
  life: number; // Время жизни сообщения (1.0 -> 0.0)
}

// Линии скорости
export interface SpeedLine {
  id: string;
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
}

// След от шин
export interface SkidMark {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
}

// Частица дыма (Оптимизация: Object Pool)
export interface Particle {
  active: boolean; // Флаг активности для переиспользования
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number; // 1.0 -> 0.0
}

// Основное состояние физики игры
export interface GameState {
  score: number;
  distance: number;
  playerSpeed: number;
  baseTrafficSpeed: number;
}

// Объект, хранящий все рефы (ссылки)
export interface GameRefs {
  canvas: HTMLCanvasElement;
  keys: Set<string>; 
  player: Entity;
  traffic: Entity[];
  speedLines: SpeedLine[];
  floatingMessages: FloatingMessage[];
  
  skidMarks: SkidMark[];
  particles: Particle[]; // Теперь это фиксированный пул
  brakingDuration: number; 
  
  // Таймер для эффекта пробуксовки (burnout)
  burnoutTimer: number; 
  
  // Таймер длительности поворота (для дыма при дрифте/резком повороте)
  turnDuration: number;

  gameState: GameState;
  timeElapsed: number; // Общее время в секундах
  
  playerVelocityX: number;
  roadOffset: number;
  environmentOffset: number; // Непрерывный оффсет для окружения (снег)
  
  // КЭШ ФОНА (СНЕЖНЫЕ ОТВАЛЫ)
  snowCache: HTMLCanvasElement | null;
  
  // Текущая амплитуда сугробов (динамически меняется от скорости)
  currentSnowAmplitude: number;

  spawnTimer: number;
  shake: { x: number; y: number };
  
  nearMissCooldowns: Set<string>;
  nearMissHistory: string[];
  wallBumpCooldown: number;
  wallBumpHistory: string[];
  
  playerCurrentLane: number;
  laneStabilityTimer: number;
  lastSpawnedLane: number;
  cameraOffset: number;
  engineIntensity: number;

  // Флаг вступительной анимации (машина выезжает)
  isIntro: boolean;
  // Флаг завершающей анимации (машина уезжает вдаль)
  isOutro: boolean;
  outroExitOffset: number; // Смещение игрока вверх во время аутро
  // Задержка появления трафика после старта
  trafficSpawnDelay: number;
}
