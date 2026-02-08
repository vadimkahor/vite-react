
import { Enemy } from '../types';
import { drawRoundedRect } from '../render/utils';

export const drawSecurity = (ctx: CanvasRenderingContext2D, e: Enemy) => {
    ctx.save();
    ctx.translate(Math.floor(e.x), Math.floor(e.y));

    const w = e.width; 
    const h = e.height;

    // FLIP if moving right (Patrol right)
    // Стандартный спрайт нарисован смотрящим влево (т.к. они бегут на игрока)
    // Если скорость положительная (идет вправо), отражаем его
    if (e.vx > 0) {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
    }

    // Анимация
    const isRunning = e.state === 'running';
    const isPatrol = e.state === 'patrol';
    const isMoving = isRunning || isPatrol;
    
    // При беге анимация быстрее, при патруле медленнее
    const animSpeedDivisor = isRunning ? 5 : 8; 
    const animTime = e.frameTimer / animSpeedDivisor;
    
    const bob = isMoving ? Math.sin(animTime) * (isRunning ? 2 : 1) : 0;

    // --- VISIBILITY INDICATOR (FLOOR GLOW) ---
    // Вместо рамки рисуем подсветку на полу
    ctx.save();
    // Смещаем центр градиента к ногам и ЧУТЬ НИЖЕ линии пола (+15px)
    ctx.translate(w / 2, h + 15); 
    
    // Эффект перспективы для круга на полу (сплющиваем по Y)
    ctx.scale(1, 0.4); 

    // Увеличен радиус и интенсивность
    const radius = isRunning ? 70 : 55; 
    const glowColor = isRunning 
        ? 'rgba(239, 68, 68, 0.6)'   // Red-500 (Alert)
        : 'rgba(249, 115, 22, 0.6)'; // Orange-500 (Idle/Patrol) - Более насыщенный

    const grad = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius);
    grad.addColorStop(0, glowColor);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    // ---------------------------------------

    const centerX = w / 2;
    const torsoY = 20 + bob;
    const shoulderY = torsoY + 4;

    // Палитра (Roblox Police Style)
    const C_SHIRT = '#3b82f6'; // Bright Blue
    const C_PANTS = '#1e293b'; // Dark Navy
    const C_SKIN = '#fca5a5';  // Skin
    const C_CAP = '#172554';   // Dark Blue Cap
    const C_ACCENT = '#fbbf24'; // Gold Badge
    const C_BELT = '#0f172a';  // Black Belt

    // Наклон корпуса при беге
    if (isRunning) {
        ctx.rotate(-0.1);
        ctx.translate(-2, 2);
    }

    // Параметры анимации конечностей
    // Ноги в противофазе (180 градусов / PI)
    // При патруле размах меньше
    const swingRange = isRunning ? 0.8 : 0.4; 
    
    const legL_Angle = Math.sin(animTime * 0.5) * swingRange;
    const legR_Angle = Math.sin(animTime * 0.5 + Math.PI) * swingRange;
    
    // Руки в противофазе к ногам той же стороны (Левая рука идет вперед, когда Левая нога идет назад)
    const armL_Angle = legL_Angle; 
    const armR_Angle = legR_Angle; 
    
    // Helper для рисования конечности (капсулы)
    const drawLimb = (x: number, y: number, width: number, height: number, angle: number, color: string) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = color;
        // Рисуем скругленный прямоугольник с центром вращения вверху
        drawRoundedRect(ctx, -width/2, -2, width, height, width/2 - 1);
        ctx.fill();
        ctx.restore();
    };

    // 1. ЗАДНЯЯ РУКА (Левая)
    // Рисуем за телом
    drawLimb(centerX + 6, shoulderY, 10, 24, armL_Angle, C_SHIRT);
    // Кисть
    ctx.save();
    ctx.translate(centerX + 6, shoulderY);
    ctx.rotate(armL_Angle);
    ctx.translate(0, 20); // Сдвиг к концу рукава
    ctx.fillStyle = C_SKIN;
    drawRoundedRect(ctx, -4, 0, 8, 8, 4);
    ctx.fill();
    ctx.restore();

    // 2. ЗАДНЯЯ НОГА (Левая)
    drawLimb(centerX + 4, torsoY + 28, 12, 26, legL_Angle, C_PANTS);

    // 3. ПЕРЕДНЯЯ НОГА (Правая)
    drawLimb(centerX - 4, torsoY + 28, 12, 26, legR_Angle, C_PANTS);

    // 4. ТЕЛО (Торс) - Скругленный прямоугольник
    ctx.fillStyle = C_SHIRT;
    drawRoundedRect(ctx, centerX - 14, torsoY, 28, 32, 6);
    ctx.fill();

    // Ремень
    ctx.fillStyle = C_BELT;
    ctx.fillRect(centerX - 14, torsoY + 26, 28, 6);
    // Бляха
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(centerX - 4, torsoY + 26, 8, 6);

    // Галстук
    ctx.fillStyle = C_PANTS;
    ctx.beginPath();
    ctx.moveTo(centerX, torsoY + 2);
    ctx.lineTo(centerX + 4, torsoY + 22);
    ctx.lineTo(centerX - 4, torsoY + 22);
    ctx.fill();

    // Значок на груди
    ctx.fillStyle = C_ACCENT;
    ctx.beginPath();
    ctx.arc(centerX - 7, torsoY + 8, 4, 0, Math.PI*2);
    ctx.fill();
    // Карманы
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(centerX + 4, torsoY + 6, 8, 1); // Правый карман
    ctx.fillRect(centerX - 12, torsoY + 6, 8, 1); // Левый карман (под значком)

    // 5. ГОЛОВА
    const headY = torsoY - 12;
    ctx.fillStyle = C_SKIN;
    ctx.beginPath();
    ctx.arc(centerX, headY, 11, 0, Math.PI * 2);
    ctx.fill();

    // Очки (Скругленные авиаторы)
    ctx.fillStyle = '#0f172a';
    // Левая линза
    drawRoundedRect(ctx, centerX - 10, headY - 3, 9, 6, 2);
    ctx.fill();
    // Правая линза
    drawRoundedRect(ctx, centerX + 1, headY - 3, 9, 6, 2);
    ctx.fill();
    // Дужка
    ctx.fillRect(centerX - 1, headY - 1, 2, 2);

    // Фуражка
    ctx.fillStyle = C_CAP;
    ctx.beginPath();
    // Купол
    ctx.arc(centerX, headY - 4, 12, Math.PI, 0); 
    ctx.lineTo(centerX + 12, headY - 4);
    ctx.lineTo(centerX - 12, headY - 4);
    ctx.fill();
    
    // Козырек (Смотрит влево, т.к. персонаж бежит влево)
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.moveTo(centerX - 12, headY - 4);
    ctx.quadraticCurveTo(centerX - 16, headY, centerX - 12, headY + 3);
    ctx.lineTo(centerX + 12, headY + 3);
    ctx.lineTo(centerX + 12, headY - 4);
    ctx.fill();
    
    // Значок на фуражке
    ctx.fillStyle = C_ACCENT;
    ctx.beginPath();
    ctx.arc(centerX, headY - 7, 3, 0, Math.PI*2);
    ctx.fill();

    // 6. ПЕРЕДНЯЯ РУКА (Правая) - БЕЗ ДУБИНКИ
    drawLimb(centerX - 6, shoulderY, 10, 24, armR_Angle, C_SHIRT);
    // Кисть
    ctx.save();
    ctx.translate(centerX - 6, shoulderY);
    ctx.rotate(armR_Angle);
    ctx.translate(0, 20); 
    ctx.fillStyle = C_SKIN;
    drawRoundedRect(ctx, -4, 0, 8, 8, 4);
    ctx.fill();
    ctx.restore();

    ctx.restore();
};
