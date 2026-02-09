
import { LEVEL3_CONFIG } from '../config';

export const drawFloor = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const ts = LEVEL3_CONFIG.TILE_SIZE;

    // 1. Фон арены (Пол - Темная плитка)
    ctx.fillStyle = LEVEL3_CONFIG.COLORS.ARENA_BG;
    ctx.fillRect(0, 0, width, height);

    // Рисуем клетчатый узор пола
    for (let r = 0; r < LEVEL3_CONFIG.ROWS; r++) {
        for (let c = 0; c < LEVEL3_CONFIG.COLS; c++) {
            const x = c * ts;
            const y = r * ts;
            
            // Шахматный порядок для плитки
            if ((r + c) % 2 === 0) {
                ctx.fillStyle = LEVEL3_CONFIG.COLORS.ARENA_GRID_DARK;
                ctx.fillRect(x, y, ts, ts);
            }
            
            // Тонкие швы между плиткой
            ctx.strokeStyle = LEVEL3_CONFIG.COLORS.ARENA_GRID_LIGHT;
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, ts, ts);
            
            // Едва заметная текстура/блик в центре плитки
            ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
            ctx.fillRect(x + 10, y + 10, ts - 20, ts - 20);
        }
    }
};
