
import { Platform } from '../types';
import { getSprite, drawRoundedRect } from './utils';

export const MEETING_TABLE_CONFIG = {
  WIDTH: 260,
  WIDTH_X2: 460, // 6 кресел
  WIDTH_X3: 660, // 9 кресел
  HEIGHT: 60,
  COLORS: {
    TOP: '#f8fafc', // Почти белый/светло-серый
    EDGE: '#cbd5e1', // Светлая кромка
    LEG: '#94a3b8'   // Матовый металл
  },
  CHAIR: {
    COLOR_MESH: '#334155', // Темная сетка
    COLOR_FRAME: '#e2e8f0', // Светлый пластик/металл
    COLOR_BASE: '#cbd5e1', // Хромированная крестовина
    LIFT_HEIGHT: 28,
    BACK_HEIGHT: 56 
  }
};

// --- Локальные хелперы для отрисовки стульев ---

const drawOfficeChairSide = (ctx: CanvasRenderingContext2D, x: number, y: number, facingRight: boolean, scale: number = 1) => {
    ctx.save();
    ctx.translate(x, y);
    if (!facingRight) {
        ctx.scale(-1, 1);
    }
    ctx.scale(scale, scale);

    const liftHeight = MEETING_TABLE_CONFIG.CHAIR.LIFT_HEIGHT;
    const seatY = -liftHeight;
    const backHeight = MEETING_TABLE_CONFIG.CHAIR.BACK_HEIGHT;

    // ПОДЛОКОТНИКИ УБРАНЫ ПО ЗАПРОСУ

    // 1. Колеса/База
    ctx.fillStyle = MEETING_TABLE_CONFIG.CHAIR.COLOR_BASE;
    ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill(); 
    ctx.fillRect(-12, -3, 24, 3); 

    // 2. Газлифт
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-3, -liftHeight, 6, liftHeight);

    // 3. Сиденье
    ctx.fillStyle = '#1e293b'; 
    ctx.beginPath();
    ctx.moveTo(-10, seatY); ctx.lineTo(14, seatY); ctx.lineTo(14, seatY + 6); 
    ctx.quadraticCurveTo(0, seatY + 8, -10, seatY + 4); ctx.fill();

    ctx.fillStyle = MEETING_TABLE_CONFIG.CHAIR.COLOR_FRAME;
    ctx.beginPath();
    ctx.moveTo(-10, seatY); ctx.lineTo(14, seatY); ctx.lineTo(14, seatY - 5); ctx.lineTo(-10, seatY - 6); ctx.fill();

    // 4. Спинка
    ctx.fillStyle = '#334155';
    ctx.beginPath(); ctx.moveTo(-6, seatY + 4); ctx.quadraticCurveTo(-15, seatY, -16, seatY - 10); ctx.lineTo(-12, seatY - 10); ctx.quadraticCurveTo(-12, seatY, -6, seatY); ctx.fill();

    ctx.save();
    ctx.translate(-14, seatY - 10);
    ctx.rotate(-5 * Math.PI / 180); 

    ctx.fillStyle = '#1e293b';
    drawRoundedRect(ctx, 0, -backHeight + 10, 6, backHeight, 2); ctx.fill();
    ctx.fillStyle = MEETING_TABLE_CONFIG.CHAIR.COLOR_MESH;
    drawRoundedRect(ctx, 4, -backHeight + 12, 4, backHeight - 4, 1); ctx.fill();
    ctx.fillStyle = '#1e293b'; ctx.fillRect(0, -backHeight, 6, 8);
    ctx.fillStyle = MEETING_TABLE_CONFIG.CHAIR.COLOR_MESH; ctx.fillRect(4, -backHeight + 1, 4, 6);
    ctx.restore();

    ctx.restore();
};

const drawOfficeChairBack = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const liftHeight = MEETING_TABLE_CONFIG.CHAIR.LIFT_HEIGHT;
    
    // Крестовина
    ctx.fillStyle = MEETING_TABLE_CONFIG.CHAIR.COLOR_BASE;
    ctx.beginPath();
    ctx.moveTo(0, 0); 
    ctx.lineTo(-12, 8); ctx.lineTo(-9, 8); ctx.lineTo(0, 2); 
    ctx.lineTo(9, 8); ctx.lineTo(12, 8); ctx.lineTo(0, 0); 
    ctx.fill();
    
    // Газлифт
    ctx.fillStyle = '#94a3b8'; 
    ctx.fillRect(-3, -liftHeight, 6, liftHeight);

    // Спинка
    const backW = 30;
    const backH = MEETING_TABLE_CONFIG.CHAIR.BACK_HEIGHT; // Используем обновленную высоту
    const backY = -liftHeight - backH + 5; 
    
    ctx.fillStyle = MEETING_TABLE_CONFIG.CHAIR.COLOR_FRAME;
    drawRoundedRect(ctx, -backW/2, backY, backW, backH, 6); ctx.fill();
    
    ctx.fillStyle = MEETING_TABLE_CONFIG.CHAIR.COLOR_MESH;
    drawRoundedRect(ctx, -backW/2 + 2, backY + 2, backW - 4, backH - 4, 4); ctx.fill();
    
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for(let i=0; i<7; i++) {
        ctx.fillRect(-backW/2 + 4, backY + 6 + (i*6), backW - 8, 1);
    }

    // Подголовник
    ctx.fillStyle = MEETING_TABLE_CONFIG.CHAIR.COLOR_MESH;
    drawRoundedRect(ctx, -12, backY - 10, 24, 8, 3); ctx.fill();
    ctx.fillStyle = '#1e293b'; ctx.fillRect(-4, backY - 2, 8, 4);

    // Подлокотники
    ctx.fillStyle = '#64748b';
    const armH = 14; const armY = -liftHeight - 18;
    ctx.fillRect(-backW/2 - 6, armY, 6, armH);
    ctx.fillRect(backW/2, armY, 6, armH);

    ctx.restore();
};

export const drawMeetingTable = (ctx: CanvasRenderingContext2D, p: Platform) => {
    const key = `platform_meeting_${p.width}_${p.height}`;
    const bottomMargin = 15;
    const extraBottom = 40; // Место для ножек стульев
    const sideMargin = 50; // Расширяем область рисования для стульев по бокам

    const totalWidth = p.width + (sideMargin * 2);

    const sprite = getSprite(key, totalWidth, p.height + bottomMargin + extraBottom, (c) => {
        // Смещаем начало координат, чтобы (0,0) спрайта соответствовало началу стола
        c.translate(sideMargin, 0);

        const x = 0; const y = 0; const w = p.width; const h = p.height;
        
        // Тень
        c.fillStyle = 'rgba(0,0,0,0.15)';
        c.beginPath(); c.ellipse(x + w/2, y + h, w/2, 6, 0, 0, Math.PI*2); c.fill();

        // 1. СТУЛЬЯ ПО КРАЯМ УДАЛЕНЫ ПО ЗАПРОСУ (остался только стол и стулья сзади)

        // 2. НОЖКИ СТОЛА
        const legW = 6;
        const legInset = 35;
        c.fillStyle = MEETING_TABLE_CONFIG.COLORS.LEG;
        
        c.fillRect(x + legInset, y + 10, legW, h - 10);
        c.fillRect(x + legInset - 8, y + h - 4, legW + 16, 4);
        c.fillRect(x + w - legInset - legW, y + 10, legW, h - 10);
        c.fillRect(x + w - legInset - legW - 8, y + h - 4, legW + 16, 4);
        c.fillRect(x + legInset, y + h/2, w - (legInset * 2), 4);

        // 3. СТОЛЕШНИЦА
        const topH = 8;
        c.fillStyle = MEETING_TABLE_CONFIG.COLORS.TOP;
        drawRoundedRect(c, x, y, w, topH, 3); c.fill();
        c.fillStyle = MEETING_TABLE_CONFIG.COLORS.EDGE;
        c.fillRect(x + 1, y + topH - 2, w - 2, 3);
        
        c.fillStyle = 'rgba(255,255,255,0.4)';
        c.beginPath(); c.moveTo(x + 20, y); c.lineTo(x + w - 100, y); c.lineTo(x + w - 80, y + topH); c.lineTo(x + 40, y + topH); c.fill();

        // 4. СТУЛЬЯ ВДОЛЬ СТОЛА
        const availableWidth = w - (legInset * 2);
        const chairCount = Math.floor(availableWidth / 60);
        const startX = legInset + (availableWidth - ((chairCount - 1) * 60)) / 2;
        
        for(let i=0; i<chairCount; i++) {
            const cx = startX + i * 60;
            drawOfficeChairBack(c, cx, y + h, 0.95);
        }
    });

    // Рисуем спрайт со смещением влево, чтобы компенсировать sideMargin
    ctx.drawImage(sprite, p.x - sideMargin, p.y);
};
