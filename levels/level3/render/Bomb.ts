
import { LEVEL3_CONFIG } from '../config';
import { Bomb, Explosion } from '../types';
import { drawRoundedRect } from './utils';

/**
 * Рисует бомбу в виде красного бумажного фонарика
 */
export const drawBomb = (ctx: CanvasRenderingContext2D, b: Bomb) => {
    const ts = LEVEL3_CONFIG.TILE_SIZE;
    const x = b.col * ts + ts / 2;
    const y = b.row * ts + ts / 2;
    
    // Анимация пульсации перед взрывом
    const progress = 1 - (b.timer / b.maxTimer);
    const pulse = Math.sin(progress * Math.PI * 8) * (progress * 5);
    const scale = 1 + (Math.sin(Date.now() * 0.01) * 0.05) + (progress * 0.1);
    
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // 1. Свечение (Glow)
    const glowRad = 20 + pulse + (progress * 15);
    const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, glowRad);
    grad.addColorStop(0, 'rgba(239, 68, 68, 0.6)'); // Red-500
    grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, glowRad, 0, Math.PI * 2);
    ctx.fill();

    // 2. Тело фонарика (Красный эллипс)
    const bodyW = 28 + pulse;
    const bodyH = 34;
    
    ctx.fillStyle = '#dc2626'; // Основной красный
    ctx.beginPath();
    ctx.ellipse(0, 0, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ребра фонарика (Горизонтальные линии)
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
        const lineY = i * 5;
        const lineW = Math.cos((lineY / (bodyH/2)) * (Math.PI/2)) * (bodyW/2);
        ctx.beginPath();
        ctx.moveTo(-lineW, lineY);
        ctx.lineTo(lineW, lineY);
        ctx.stroke();
    }

    // 3. Золотые узоры (Круги)
    ctx.strokeStyle = '#d97706'; // Amber-600
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.stroke();
    
    // 4. Крышки (Топ и боттом)
    ctx.fillStyle = '#451a03'; // Темное дерево
    ctx.fillRect(-10, -bodyH/2 - 2, 20, 4); // Верх
    ctx.fillRect(-10, bodyH/2 - 2, 20, 4);  // Низ
    
    // Золотая кайма
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-10, -bodyH/2 - 1, 20, 1);
    ctx.fillRect(-10, bodyH/2 + 1, 20, 1);

    // 5. Кисточка (Tassel)
    const tasselLen = 15;
    const tasselY = bodyH/2 + 2;
    ctx.fillStyle = '#fbbf24'; // Золотой/Желтый
    // Нить
    ctx.fillRect(-1, tasselY, 2, 5);
    // Сама кисточка
    ctx.beginPath();
    ctx.moveTo(-4, tasselY + 5);
    ctx.lineTo(4, tasselY + 5);
    ctx.lineTo(6, tasselY + tasselLen);
    ctx.lineTo(-6, tasselY + tasselLen);
    ctx.closePath();
    ctx.fill();
    // Детали кисточки
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 0.5;
    for(let i=-1; i<=1; i++) {
        ctx.beginPath(); ctx.moveTo(i*2, tasselY+5); ctx.lineTo(i*3, tasselY+tasselLen); ctx.stroke();
    }

    ctx.restore();
};

/**
 * Рисует эффект взрыва
 */
export const drawExplosion = (ctx: CanvasRenderingContext2D, e: Explosion) => {
    const ts = LEVEL3_CONFIG.TILE_SIZE;
    
    ctx.save();
    ctx.globalAlpha = Math.min(1, e.life * 2); // Быстрое появление, плавное затухание
    
    e.cells.forEach(cell => {
        const cx = cell.col * ts + ts/2;
        const cy = cell.row * ts + ts/2;
        
        // Внутреннее яркое ядро
        const grad = ctx.createRadialGradient(cx, cy, ts * 0.1, cx, cy, ts * 0.6);
        grad.addColorStop(0, '#fffbeb'); // Белый центр
        grad.addColorStop(0.3, '#fbbf24'); // Желтый
        grad.addColorStop(0.6, '#ef4444'); // Красный
        grad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, ts * 0.6 * (1 + (1 - e.life) * 0.5), 0, Math.PI * 2);
        ctx.fill();
        
        // Искры / Осколки
        if (e.life > 0.5) {
            ctx.fillStyle = '#f59e0b';
            for (let i = 0; i < 5; i++) {
                const ang = Math.random() * Math.PI * 2;
                const dist = Math.random() * ts * 0.4;
                ctx.beginPath();
                ctx.arc(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });
    
    ctx.restore();
};
