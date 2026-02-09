
import { LEVEL3_CONFIG } from './config';
import { Level3State } from './types';
import { drawPlayer } from './render/Character';
import { drawFloor } from './render/Floor';
import { drawArenaBorder } from './render/Border';
import { drawHardBlock, drawChair, generateChairs, ChairData } from './render/Table';
import { drawSoftBlock } from './render/Shoji';
import { drawDoor } from './render/Door';
import { drawEnemy } from './render/Enemy';
import { drawBomb, drawExplosion } from './render/Bomb';

// Кэш для статического слоя арены
let staticArenaCache: HTMLCanvasElement | null = null;
let chairCache: ChairData[] | null = null;
let tableCache: { x: number, y: number, col: number, row: number, variant: number, sortY: number }[] = [];

/**
 * Очищает кэш отрисовки (вызывается при смене комнаты)
 */
export const clearStaticCache = () => {
    staticArenaCache = null;
    chairCache = null;
    tableCache = [];
};

/**
 * Генерирует список столов и их вариантов сервировки
 */
const generateTables = () => {
    const tables = [];
    const ts = LEVEL3_CONFIG.TILE_SIZE;
    const tableVariants = new Map<string, number>();
    const TOTAL_VARIANTS = 8;

    for (let r = 1; r < LEVEL3_CONFIG.ROWS - 1; r++) {
        for (let c = 1; c < LEVEL3_CONFIG.COLS - 1; c++) {
            const isInnerGrid = (r % 2 === 0) && (c % 2 === 0);
            if (isInnerGrid) {
                const neighborVariants = new Set<number>();
                const leftKey = `${c - 2},${r}`, topKey = `${c},${r - 2}`;
                if (tableVariants.has(leftKey)) neighborVariants.add(tableVariants.get(leftKey)!);
                if (tableVariants.has(topKey)) neighborVariants.add(tableVariants.get(topKey)!);

                const seed = Math.abs(Math.sin(c * 12.9898 + r * 78.233) * 43758.5453);
                let variant = Math.floor((seed - Math.floor(seed)) * TOTAL_VARIANTS);
                while (neighborVariants.has(variant)) { variant = (variant + 1) % TOTAL_VARIANTS; }
                tableVariants.set(`${c},${r}`, variant);

                tables.push({
                    x: c * ts,
                    y: r * ts,
                    col: c,
                    row: r,
                    variant: variant,
                    sortY: r * ts + ts - 4 
                });
            }
        }
    }
    return tables;
};

const generateStaticArena = (width: number, height: number): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const ts = LEVEL3_CONFIG.TILE_SIZE;
    drawFloor(ctx, width, height);
    drawArenaBorder(ctx, width, height, ts);
    return canvas;
};

export const drawLevel3 = (ctx: CanvasRenderingContext2D, state: Level3State, width: number, height: number) => {
  const ts = LEVEL3_CONFIG.TILE_SIZE;
  const arenaW = LEVEL3_CONFIG.COLS * ts;
  const arenaH = LEVEL3_CONFIG.ROWS * ts;
  
  if (!staticArenaCache || staticArenaCache.width !== arenaW || staticArenaCache.height !== arenaH) {
      staticArenaCache = generateStaticArena(arenaW, arenaH);
      chairCache = generateChairs();
      tableCache = generateTables();
  }
  
  const offsetX = Math.floor((width - arenaW) / 2);
  const offsetY = Math.floor((height - arenaH) / 2);

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(offsetX, offsetY);

  // 1. Статика
  ctx.drawImage(staticArenaCache, 0, 0);

  // 2. Двери
  for (const door of state.doors) {
      drawDoor(ctx, door, state.roomNumber === 2);
  }

  // 3. Динамика с сортировкой по Y
  const renderList: { type: 'player' | 'chair' | 'softBlock' | 'table' | 'enemy' | 'bomb', y: number, data: any }[] = [];

  for (const table of tableCache) {
      renderList.push({ type: 'table', y: table.sortY, data: table });
  }

  if (chairCache) {
      for (const chair of chairCache) {
          renderList.push({ type: 'chair', y: chair.sortY, data: chair });
      }
  }

  renderList.push({ type: 'player', y: state.player.y + 50, data: state.player }); 

  for (const enemy of state.enemies) {
      renderList.push({ type: 'enemy', y: enemy.y + 50, data: enemy });
  }

  for (const bomb of state.bombs) {
      renderList.push({ type: 'bomb', y: bomb.row * ts + ts, data: bomb });
  }

  for (const sb of state.softBlocks) {
      const thickness = 14;
      const offset = (ts - thickness) / 2;
      // Скорректирован sortY: для горизонтальных перегородок это нижняя граница рамы
      const sortY = sb.axis === 'v' ? sb.row * ts + ts : sb.row * ts + offset + thickness;
      renderList.push({ type: 'softBlock', y: sortY, data: sb });
  }

  renderList.sort((a, b) => a.y - b.y);

  // Используем реальное время для анимации окружения (пар, свечи), 
  // чтобы оно работало, даже когда игрок стоит.
  // Делим на 16, чтобы примерно соответствовать скорости 60 FPS (1000/60 ~= 16.6)
  const envTime = performance.now() * 0.06;

  for (const item of renderList) {
      if (item.type === 'chair') {
          drawChair(ctx, item.data.cx, item.data.cy, item.data.angle, item.data.offset);
      } else if (item.type === 'table') {
          const hasCake = state.cakePos?.col === item.data.col && state.cakePos?.row === item.data.row;
          drawHardBlock(ctx, item.data.x, item.data.y, ts, item.data.variant, hasCake, envTime);
      } else if (item.type === 'softBlock') {
          drawSoftBlock(ctx, item.data.col * ts, item.data.row * ts, item.data.axis);
      } else if (item.type === 'enemy') {
          drawEnemy(ctx, item.data);
      } else if (item.type === 'bomb') {
          drawBomb(ctx, item.data);
      } else {
          drawPlayer(ctx, item.data);
      }
  }
  
  for (const explosion of state.explosions) {
      drawExplosion(ctx, explosion);
  }
  
  ctx.restore();
};
