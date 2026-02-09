
import { LEVEL3_CONFIG } from '../config';

/**
 * Рисует единую конструкцию стен (деревянная обшивка)
 */
export const drawArenaBorder = (ctx: CanvasRenderingContext2D, w: number, h: number, ts: number) => {
    const depth = 14; 
    const faceSize = ts - depth;
    
    // 1. ТЕМНЫЕ ГРАНИ (Боковины дерева)
    ctx.fillStyle = LEVEL3_CONFIG.COLORS.WALL_SIDE;
    
    ctx.fillRect(0, h - depth, w, depth); // Низ
    ctx.fillRect(faceSize, faceSize, w - 2 * faceSize, depth); // Внутр. верх
    ctx.fillRect(faceSize, faceSize, depth, h - ts - faceSize); // Внутр. лево
    ctx.fillRect(w - ts, faceSize, depth, h - ts - faceSize); // Внутр. право
    
    // Заливка уголков
    ctx.fillRect(faceSize, faceSize, depth, depth); 
    ctx.fillRect(w - ts, faceSize, depth, depth);   

    // 2. ВЕРХНЯЯ ПЛОЩАДКА (Полированное темное дерево)
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, LEVEL3_CONFIG.COLORS.WALL_TOP_LIGHT); 
    grad.addColorStop(1, LEVEL3_CONFIG.COLORS.WALL_TOP_DARK);  
    ctx.fillStyle = grad;
    
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h - depth); ctx.lineTo(0, h - depth); ctx.closePath();
    
    const innerTop = faceSize;
    const innerBottom = h - ts;
    const innerLeft = faceSize;
    const innerRight = w - faceSize;

    ctx.moveTo(innerLeft, innerTop); ctx.lineTo(innerLeft, innerBottom); ctx.lineTo(innerRight, innerBottom); ctx.lineTo(innerRight, innerTop); ctx.closePath();
    
    ctx.fill('evenodd');
    
    // 3. УСИЛЕННАЯ ТЕКСТУРА (Только для внешних стен)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h - depth); ctx.lineTo(0, h - depth); ctx.closePath();
    ctx.moveTo(innerLeft, innerTop); ctx.lineTo(innerLeft, innerBottom); ctx.lineTo(innerRight, innerBottom); ctx.lineTo(innerRight, innerTop); ctx.closePath();
    ctx.clip('evenodd');

    const grainH = h - depth;

    // 3.1 Темные волокна (Opacity 0.15 по запросу)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)'; 
    ctx.lineWidth = 1.2;
    
    const density = 14; 
    for (let i = -20; i < w + 20; i += density) {
        ctx.beginPath();
        const startX = i;
        const endX = i + (Math.sin(i * 0.1) * 20);
        
        ctx.moveTo(startX, 0);
        ctx.bezierCurveTo(
            startX + 15, grainH * 0.33,
            endX - 15, grainH * 0.66,
            endX, grainH
        );
        ctx.stroke();
    }

    // 3.2 Светлые прожилки (rgba(255, 255, 255, 0.05) по запросу)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 0.8;
    for (let i = -10; i < w + 10; i += density * 1.5) {
        ctx.beginPath();
        const startX = i + 5;
        const endX = i + 5 + (Math.cos(i * 0.1) * 10);
        ctx.moveTo(startX, 0);
        ctx.bezierCurveTo(startX + 10, grainH * 0.5, endX - 10, grainH * 0.5, endX, grainH);
        ctx.stroke();
    }
    
    // 3.3 Продольные кольца для глубины
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    for(let i=0; i<4; i++) {
        const py = (grainH * 0.15) + (i * grainH * 0.25);
        ctx.fillRect(0, py, w, 3);
    }

    ctx.restore();
    
    // 4. ОБВОДКА
    ctx.strokeStyle = '#1a120b';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, w, h - depth);
    ctx.strokeRect(innerLeft, innerTop, innerRight - innerLeft, innerBottom - innerTop);
    
    // 5. БЛИКИ (Лакировка)
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(0, 0, w, 2);
    ctx.fillRect(innerLeft, innerBottom - 2, innerRight - innerLeft, 2);
};
