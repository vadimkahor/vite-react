
import { LEVEL3_CONFIG } from '../config';
import { drawRoundedRect } from './utils';

/**
 * Рисует мягкий блок (Сёдзи - Японская перегородка)
 */
export const drawSoftBlock = (ctx: CanvasRenderingContext2D, tileX: number, tileY: number, axis: 'h'|'v') => {
    const ts = LEVEL3_CONFIG.TILE_SIZE;
    const thickness = 14; 
    const offset = (ts - thickness) / 2;
    
    let x, y, w, h;
    
    if (axis === 'v') {
        x = tileX + offset;
        y = tileY;
        w = thickness;
        h = ts;
    } else {
        x = tileX;
        y = tileY + offset;
        w = ts;
        h = thickness;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    if (axis === 'h') {
        drawRoundedRect(ctx, x + 4, y + h - 2, w - 8, 6, 2); 
    } else {
        drawRoundedRect(ctx, x + 2, y + h - 4, w - 4, 6, 2); 
    }
    ctx.fill();

    // Frame (Dark Wood)
    ctx.fillStyle = LEVEL3_CONFIG.COLORS.SHOJI_FRAME;
    drawRoundedRect(ctx, x, y, w, h, 2); 
    ctx.fill();

    // Paper (Dark/Dim)
    const frameSize = 2;
    ctx.fillStyle = LEVEL3_CONFIG.COLORS.SHOJI_PAPER;
    ctx.fillRect(x + frameSize, y + frameSize, w - frameSize*2, h - frameSize*2);

    // Grid (Kumiko dividers)
    ctx.fillStyle = LEVEL3_CONFIG.COLORS.SHOJI_FRAME;
    const gridSize = 2;
    
    if (axis === 'v') {
        const sections = 3;
        const sectionH = h / sections;
        for(let i=1; i<sections; i++) {
            ctx.fillRect(x, y + i*sectionH - gridSize/2, w, gridSize);
        }
    } else {
        const sections = 3;
        const sectionW = w / sections;
        for(let i=1; i<sections; i++) {
            ctx.fillRect(x + i*sectionW - gridSize/2, y, gridSize, h);
        }
    }
};
