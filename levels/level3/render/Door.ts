
import { LEVEL3_CONFIG } from '../config';
import { Door } from '../types';

/**
 * Рисует дверь (прямоугольная, компактная)
 */
export const drawDoor = (ctx: CanvasRenderingContext2D, door: Door, isRoom2: boolean = false) => {
    const ts = LEVEL3_CONFIG.TILE_SIZE;
    const x = door.col * ts;
    const y = door.row * ts;
    
    const doorWidth = ts * 0.6; 
    const doorHeight = ts * 0.8; 
    
    const dx = x + (ts - doorWidth) / 2;
    
    let dy = y;
    if (door.side === 'bottom') dy = y; 
    else if (door.side === 'top') dy = y + (ts - doorHeight);
    else dy = y + (ts - doorHeight) / 2;
    
    ctx.save();
    
    // 1. Тень / Проем (Темная подложка)
    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(dx, dy, doorWidth, doorHeight);

    // 2. Сама дверь (Цветная панель)
    // В Room 2 входная дверь становится ЗЕЛЕНОЙ, потому что мы вышли из зеленой двери
    let doorColor = door.type === 'entry' ? LEVEL3_CONFIG.COLORS.DOOR_ENTRY : LEVEL3_CONFIG.COLORS.DOOR_EXIT;
    if (isRoom2 && door.type === 'entry') {
        doorColor = LEVEL3_CONFIG.COLORS.DOOR_EXIT;
    }
    
    ctx.fillStyle = doorColor;
    const border = 4;
    ctx.fillRect(dx + border/2, dy + border/2, doorWidth - border, doorHeight - border/2);
    
    // 3. Обводка / Косяк
    ctx.strokeStyle = '#271c19'; 
    ctx.lineWidth = border;
    ctx.strokeRect(dx, dy, doorWidth, doorHeight);

    // 4. Табличка / Норен (Ткань сверху)
    const norenHeight = doorHeight * 0.4;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; 
    ctx.fillRect(dx + border, dy + border + 2, doorWidth - border*2, norenHeight);
    ctx.fillStyle = '#f5f5f4'; 
    ctx.fillRect(dx + border, dy + border, doorWidth - border*2, norenHeight);
    ctx.fillStyle = doorColor; 
    ctx.fillRect(dx + doorWidth/2 - 1, dy + border, 2, norenHeight * 0.8);

    // 5. Иероглиф
    ctx.fillStyle = '#1c1917';
    ctx.font = 'bold 16px Arial'; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const symbol = door.type === 'entry' ? '入' : '出';
    ctx.fillText(symbol, dx + doorWidth/2, dy + border + norenHeight/2);

    // 6. Эффект свечения для выхода (Или входа во второй комнате)
    const shouldGlow = door.type === 'exit' || (isRoom2 && door.type === 'entry');
    if (shouldGlow) {
        ctx.globalCompositeOperation = 'screen';
        const glowGrad = ctx.createRadialGradient(dx + doorWidth/2, dy + doorHeight/2, 10, dx + doorWidth/2, dy + doorHeight/2, 40);
        glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        glowGrad.addColorStop(1, 'rgba(22, 163, 74, 0)'); 
        ctx.fillStyle = glowGrad;
        ctx.fillRect(dx - 10, dy - 10, doorWidth + 20, doorHeight + 20); 
        ctx.globalCompositeOperation = 'source-over';
    }

    ctx.restore();
};