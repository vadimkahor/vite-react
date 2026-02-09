import { LEVEL3_CONFIG } from './config';
import { Level3State } from './types';
import { placeBomb, updateBombsAndExplosions } from './logic/BombLogic';
import { updateEnemies } from './logic/EnemyLogic';

export const updateLevel3 = (
    state: Level3State, 
    keys: Set<string>, 
    timeScale: number,
    onGameOver: () => void,
    onComplete: (score: number, time: number) => void
) => {
  const ts = LEVEL3_CONFIG.TILE_SIZE;
  const speed = LEVEL3_CONFIG.MOVE_SPEED * timeScale;
  const p = state.player;

  // Параметры хитбокса Кати (должны совпадать с теми, что в isColliding)
  const hitboxMarginX = 8;
  const hitboxHeight = 24;
  const hitboxYOffset = (LEVEL3_CONFIG.PLAYER_HEIGHT - hitboxHeight) / 2 + 10;
  const pWidth = LEVEL3_CONFIG.PLAYER_WIDTH - (hitboxMarginX * 2);

  // 1. ВВОД
  let dx = 0;
  let dy = 0;

  if (keys.has('ArrowLeft')) { dx = -speed; p.dir = 'left'; }
  else if (keys.has('ArrowRight')) { dx = speed; p.dir = 'right'; }
  else if (keys.has('ArrowUp')) { dy = -speed; p.dir = 'up'; }
  else if (keys.has('ArrowDown')) { dy = speed; p.dir = 'down'; }

  if (keys.has(' ')) placeBomb(state);

  p.isMoving = dx !== 0 || dy !== 0;
  if (p.isMoving) p.frame += timeScale;

  // 2. ОБНОВЛЕНИЕ ОБЪЕКТОВ
  updateBombsAndExplosions(state, timeScale, onGameOver);
  updateEnemies(state, timeScale, onGameOver);

  // 3. ПРОВЕРКА КОЛЛИЗИЙ
  const isColliding = (nx: number, ny: number): boolean => {
      // Прямоугольник игрока в целевой позиции (куда хотим наступить)
      const px = nx + hitboxMarginX;
      const py = ny + hitboxYOffset;
      const pr = px + pWidth;
      const pb = py + hitboxHeight;

      // Прямоугольник игрока в ТЕКУЩЕЙ позиции (где стоим сейчас)
      const curPx = p.x + hitboxMarginX;
      const curPy = p.y + hitboxYOffset;
      const curPr = curPx + pWidth;
      const curPb = curPy + hitboxHeight;

      const startCol = Math.floor(px / ts);
      const endCol = Math.floor(pr / ts);
      const startRow = Math.floor(py / ts);
      const endRow = Math.floor(pb / ts);

      const blockMargin = 4;
      const blockW = ts - (blockMargin * 2);

      for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
              if (state.doors.some(d => d.col === c && d.row === r)) continue;

              // ЛОГИКА БОМБ (Алгоритм динамической проницаемости):
              if (state.bombs.some(b => b.col === c && b.row === r)) {
                  // Проверяем: Касаемся ли мы этой клетки ПРЯМО СЕЙЧАС?
                  const bx1 = c * ts;
                  const by1 = r * ts;
                  const bx2 = bx1 + ts;
                  const by2 = by1 + ts;

                  const isTouchingCurrently = curPx < bx2 && curPr > bx1 && curPy < by2 && curPb > by1;

                  // Если мы уже внутри этой клетки, мы игнорируем коллизию (даем выйти).
                  // Если мы снаружи — бомба для нас твердая.
                  if (!isTouchingCurrently) {
                      return true;
                  }
              }

              // Твердые блоки (столы)
              const isHardBlock = (r % 2 === 0) && (c % 2 === 0) && r >= 1 && c >= 1 && r < LEVEL3_CONFIG.ROWS - 1 && c < LEVEL3_CONFIG.COLS - 1;
              if (isHardBlock) {
                  const bx = c * ts + blockMargin;
                  const by = r * ts + blockMargin;
                  if (px < bx + blockW && pr > bx && py < by + blockW && pb > by) return true;
              }

              // Мягкие блоки (перегородки)
              const softBlock = state.softBlocks.find(sb => sb.col === c && sb.row === r);
              if (softBlock) {
                  const thickness = 14; 
                  const offset = (ts - thickness) / 2;
                  let bx, by, bw, bh;
                  if (softBlock.axis === 'v') { 
                      bx = c * ts + offset; by = r * ts; bw = thickness; bh = ts; 
                  } else { 
                      bx = c * ts; by = r * ts + offset - 4; bw = ts; bh = thickness + 8; 
                  }
                  if (px < bx + bw && pr > bx && py < by + bh && pb > by) return true;
              }

              // Стены арены
              if (c < 1 || c >= LEVEL3_CONFIG.COLS - 1 || r < 1 || r >= LEVEL3_CONFIG.ROWS - 1) return true;
          }
      }
      return false;
  };

  // 4. ДВИЖЕНИЕ С ПРОВЕРКОЙ ВЫРАВНИВАНИЯ
  const alignSpeed = 3.0 * timeScale; 
  if (dx !== 0) {
      const centerY = Math.floor((p.y + LEVEL3_CONFIG.PLAYER_HEIGHT / 2) / ts) * ts + (ts - LEVEL3_CONFIG.PLAYER_HEIGHT) / 2;
      const diffY = centerY - p.y;
      if (Math.abs(diffY) > 0.1) {
          const stepY = Math.abs(diffY) < alignSpeed ? diffY : Math.sign(diffY) * alignSpeed;
          if (!isColliding(p.x, p.y + stepY)) p.y += stepY;
      }

      const nextX = p.x + dx;
      if (!isColliding(nextX, p.y)) p.x = nextX;
  } else if (dy !== 0) {
      const centerX = Math.floor((p.x + LEVEL3_CONFIG.PLAYER_WIDTH / 2) / ts) * ts + (ts - LEVEL3_CONFIG.PLAYER_WIDTH) / 2;
      const diffX = centerX - p.x;
      if (Math.abs(diffX) > 0.1) {
          const stepX = Math.abs(diffX) < alignSpeed ? diffX : Math.sign(diffX) * alignSpeed;
          if (!isColliding(p.x + stepX, p.y)) p.x += stepX;
      }

      const nextY = p.y + dy;
      if (!isColliding(p.x, nextY)) p.y = nextY;
  }

  // 5. ПРОВЕРКА ВЫХОДА ИЛИ ТОРТА
  if (state.roomNumber === 1) {
      const exitDoor = state.doors.find(d => d.type === 'exit');
      if (exitDoor) {
          const doorRect = { left: exitDoor.col * ts, top: exitDoor.row * ts, right: (exitDoor.col + 1) * ts, bottom: (exitDoor.row + 1) * ts };
          const pRect = { left: p.x + hitboxMarginX, top: p.y + hitboxYOffset, right: p.x + hitboxMarginX + pWidth, bottom: p.y + hitboxYOffset + hitboxHeight };
          if (pRect.left < doorRect.right && pRect.right > doorRect.left && pRect.top < doorRect.bottom && pRect.bottom > doorRect.top) {
              onComplete(1000, 0); 
          }
      }
  } else if (state.cakePos) {
      const cx = (p.x + LEVEL3_CONFIG.PLAYER_WIDTH / 2);
      const cy = (p.y + LEVEL3_CONFIG.PLAYER_HEIGHT / 2);
      const targetX = state.cakePos.col * ts + ts / 2;
      const targetY = state.cakePos.row * ts + ts / 2;
      const dist = Math.sqrt(Math.pow(cx - targetX, 2) + Math.pow(cy - targetY, 2));
      
      if (dist < 64) {
          onComplete(1000, 0);
      }
  }
};