
export interface SoftBlock {
  col: number;
  row: number;
  axis: 'h' | 'v'; // Ориентация перегородки: горизонтальная или вертикальная
}

export interface Door {
  col: number;
  row: number;
  side: 'top' | 'bottom' | 'left' | 'right';
  type: 'entry' | 'exit';
}

export interface SpeechBubble {
  text: string;
  timer: number;
  maxTimer: number;
}

export interface AshPile {
  id: string;
  col: number;
  row: number;
  life: number;
  speechBubble?: SpeechBubble;
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  type: 'waiter' | 'chef';
  dir: 'up' | 'down' | 'left' | 'right';
  state: 'patrol' | 'chase' | 'stunned';
  speed: number;
  frame: number;
  stunTimer: number; // В кадрах (60 = 1 сек)
  lastMoveTimer: number; // Для плавности патруля
  speechBubble?: SpeechBubble;
}

export interface Level3State {
  player: {
    x: number;
    y: number;
    dir: 'up' | 'down' | 'left' | 'right';
    isMoving: boolean;
    frame: number;
    speechBubble?: SpeechBubble;
  };
  enemies: Enemy[];
  softBlocks: SoftBlock[];
  doors: Door[];
  bombs: Bomb[];
  explosions: Explosion[];
  ashPiles: AshPile[];
  timer: number;
  // Система зарядов бомб
  bombCharges: number;
  maxBombCharges: number;
  rechargeTimers: number[]; // Таймеры для восстановления каждого отсутствующего заряда
  // Прогресс комнат
  roomNumber: number;
  cakePos?: { col: number, row: number }; // Позиция финального торта
}

export interface Bomb {
  id: string;
  col: number;
  row: number;
  timer: number; // Оставшееся время до взрыва (в кадрах)
  maxTimer: number;
}

export interface Explosion {
  id: string;
  col: number;
  row: number;
  life: number; // 1.0 -> 0.0
  cells: {col: number, row: number}[]; // Список задетых клеток
}
