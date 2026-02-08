
export enum GameStatus {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  GAMEOVER = 'GAMEOVER',
  VICTORY = 'VICTORY'
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  color: string;
  type: 'player' | 'traffic' | 'coin';
}

export interface LevelProps {
  onGameOver: (score: number, reason?: string) => void;
  onComplete: (score: number, timeSpent: number) => void;
  isActive: boolean;
  startAtBoss?: boolean;
}
