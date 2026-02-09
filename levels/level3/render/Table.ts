
import { LEVEL3_CONFIG } from '../config';
import { drawRoundedRect, drawWoodGrain } from './utils';

export interface ChairData {
    cx: number;
    cy: number;
    angle: number;
    offset: number;
    sortY: number;
}

// Хелпер для отрисовки пара/дыма
const drawSteam = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number, color: string = 'rgba(255, 255, 255, 0.4)') => {
    ctx.save();
    ctx.fillStyle = color;
    // 3 частицы пара
    for (let i = 0; i < 3; i++) {
        // Смещение фазы для каждой частицы
        const offset = i * 20; 
        const t = (time * 0.5 + offset) % 60; // Цикл 60 кадров
        const alpha = Math.max(0, 1 - (t / 60));
        const py = y - (t * 0.5);
        const px = x + Math.sin(t * 0.1 + i) * 3;
        const size = 2 + (t * 0.05);

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
};

/**
 * Рисует праздничный торт со свечами
 */
export const drawCake = (ctx: CanvasRenderingContext2D, cx: number, cy: number, time: number) => {
    ctx.save();
    ctx.translate(cx, cy);

    // 0. Усиленный эффект свечения (Enhanced Multi-layer Glow)
    const pulse = Math.sin(time * 0.15);
    const glowSize = 75 + pulse * 15;
    
    // Внешнее мягкое свечение
    const outerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize * 1.5);
    outerGlow.addColorStop(0, 'rgba(251, 146, 60, 0.4)');
    outerGlow.addColorStop(0.6, 'rgba(251, 146, 60, 0.1)');
    outerGlow.addColorStop(1, 'rgba(251, 146, 60, 0)');
    
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(0, 0, glowSize * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Внутреннее яркое ядро свечения
    const innerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize * 0.6);
    innerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    innerGlow.addColorStop(0.4, 'rgba(251, 146, 60, 0.5)');
    innerGlow.addColorStop(1, 'rgba(251, 146, 60, 0)');
    
    ctx.fillStyle = innerGlow;
    ctx.beginPath();
    ctx.arc(0, 0, glowSize * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Сверкающие частицы вокруг торта
    for (let i = 0; i < 6; i++) {
        const angle = (time * 0.05) + (i * (Math.PI * 2 / 6));
        const dist = 30 + Math.sin(time * 0.1 + i) * 10;
        const sx = Math.cos(angle) * dist;
        const sy = Math.sin(angle) * dist - 10;
        const sSize = 2 + Math.sin(time * 0.2 + i);
        
        ctx.fillStyle = '#fffbeb';
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(0.5, sSize), 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.globalCompositeOperation = 'source-over';

    // 1. Подставка для торта
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath(); ctx.ellipse(0, 5, 18, 6, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-2, 5, 4, 8);

    // 2. Торт
    ctx.fillStyle = '#f472b6'; // Розовый бисквит
    drawRoundedRect(ctx, -14, -10, 28, 12, 4); ctx.fill();
    ctx.fillStyle = '#fdf2f8'; // Белая глазурь сверху
    drawRoundedRect(ctx, -14, -12, 28, 6, 4); ctx.fill();

    // 3. Свечи
    const candles = [-8, 0, 8];
    candles.forEach((offset, i) => {
        const cx_cand = offset;
        const cy_cand = -12;
        
        // Тело свечи
        ctx.fillStyle = i === 1 ? '#3b82f6' : '#fbbf24';
        ctx.fillRect(cx_cand - 1, cy_cand - 8, 2, 8);

        // Пламя свечи (анимированное)
        const flameBob = Math.sin(time * 0.2 + i) * 2;
        const flameSize = 3 + Math.sin(time * 0.3 + i);
        
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(cx_cand, cy_cand - 10 + flameBob, flameSize, 0, Math.PI*2);
        ctx.fill();
        
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(cx_cand, cy_cand - 10 + flameBob, flameSize * 0.5, 0, Math.PI*2);
        ctx.fill();
    });

    ctx.restore();
};

/**
 * Генерирует список стульев на основе размещения столов
 */
export const generateChairs = (): ChairData[] => {
    const chairs: ChairData[] = [];
    const ts = LEVEL3_CONFIG.TILE_SIZE;

    for (let c = 1; c < LEVEL3_CONFIG.COLS - 1; c++) {
        for (let r = 1; r < LEVEL3_CONFIG.ROWS - 1; r++) {
            const isInnerGrid = (r % 2 === 0) && (c % 2 === 0);
            if (isInnerGrid) {
                const cx = c * ts + ts / 2;
                const cy = r * ts + ts / 2;
                const chairOffset = 28;

                const seed = Math.sin(c * 12.9898 + r * 78.233) * 43758.5453;
                const rand = seed - Math.floor(seed);
                
                const add = (angle: number) => {
                    const sortY = r * ts + ts - 10; 
                    chairs.push({ cx, cy, angle, offset: chairOffset, sortY });
                };

                if (rand > 0.2) {
                    if (rand > 0.8 || (rand > 0.5 && rand < 0.65) || (rand > 0.2 && rand < 0.3)) add(-Math.PI / 2); // Справа
                    if (rand > 0.8 || (rand > 0.5 && rand < 0.65)) add(Math.PI / 2); // Слева
                    if (rand > 0.8 || (rand > 0.65 && rand <= 0.8) || (rand > 0.3 && rand < 0.4)) add(Math.PI); // Сверху
                    if (rand > 0.8 || (rand > 0.65 && rand <= 0.8)) add(0); // Снизу
                }
            }
        }
    }
    return chairs;
};

/**
 * Рисует стул в японском стиле
 */
export const drawChair = (ctx: CanvasRenderingContext2D, cx: number, cy: number, angle: number, offset: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.translate(0, offset); 

    const chairW = 26;
    const chairD = 22; 
    
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    drawRoundedRect(ctx, -chairW/2 + 2, -chairD/2 + 2, chairW, chairD, 4);
    ctx.fill();

    ctx.fillStyle = '#b91c1c'; 
    drawRoundedRect(ctx, -chairW/2, -chairD/2, chairW, chairD, 4);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.ellipse(0, 0, chairW/3, chairD/3, 0, 0, Math.PI*2);
    ctx.fill();

    const backH = 6;
    const backY = chairD/2 - backH;
    
    ctx.fillStyle = '#3f1d0b'; 
    drawRoundedRect(ctx, -chairW/2 - 2, backY, chairW + 4, backH, 2); 
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(-chairW/2, backY + 1, chairW, 2);

    ctx.restore();
};

/**
 * Рисует твердый блок (Стол)
 */
export const drawHardBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, variant: number, hasCake: boolean = false, time: number = 0) => {
  const heightOffset = 10; 
  const tableMargin = 4;
  const tx = x + tableMargin;
  const ty = y + tableMargin;
  const ts = s - tableMargin * 2;
  
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  drawRoundedRect(ctx, tx + 4, ty + heightOffset + 4, ts, ts - heightOffset, 6);
  ctx.fill();

  ctx.fillStyle = '#3f1d0b';
  drawRoundedRect(ctx, tx, ty + heightOffset, ts, ts - heightOffset, 6);
  ctx.fill();

  const topY = ty;
  const topH = ts - heightOffset;
  
  const grad = ctx.createLinearGradient(tx, topY, tx + ts, topY + topH);
  grad.addColorStop(0, '#78350f');
  grad.addColorStop(1, '#451a03');
  
  ctx.fillStyle = grad;
  drawRoundedRect(ctx, tx, topY, ts, topH, 6);
  ctx.fill();
  
  drawWoodGrain(ctx, tx, topY, ts, topH);

  ctx.strokeStyle = '#271004'; 
  ctx.lineWidth = 1;
  ctx.stroke();

  const scx = tx + ts / 2;
  const scy = topY + topH / 2;

  if (hasCake) {
      drawCake(ctx, scx, scy, time);
      return;
  }

  switch (variant) {
    case 0: // СУШИ СЕТ
      const plateW = 24; const plateH = 16;
      ctx.fillStyle = '#f8fafc'; 
      drawRoundedRect(ctx, scx - plateW/2, scy - plateH/2, plateW, plateH, 3); ctx.fill();
      // Роллы
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(scx, scy, 5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#f1f5f9'; ctx.beginPath(); ctx.arc(scx, scy, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(scx, scy, 2, 0, Math.PI*2); ctx.fill(); // Красная икра
      
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(scx + 6, scy + 2, 5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#f1f5f9'; ctx.beginPath(); ctx.arc(scx + 6, scy + 2, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#16a34a'; ctx.beginPath(); ctx.arc(scx + 6, scy + 2, 2, 0, Math.PI*2); ctx.fill(); // Огурец
      
      // Палочки
      ctx.fillStyle = '#fcd34d'; 
      ctx.save(); ctx.translate(scx - 10, scy + 12); ctx.rotate(-0.2);
      ctx.fillRect(0, 0, 26, 2); ctx.rotate(0.1); ctx.fillRect(0, 3, 26, 2); ctx.restore();
      
      const cupX = scx + 14; const cupY = scy - 10;
      ctx.fillStyle = '#115e59'; ctx.beginPath(); ctx.arc(cupX, cupY, 5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#dcfce7'; ctx.beginPath(); ctx.arc(cupX, cupY, 3, 0, Math.PI*2); ctx.fill();
      // Пар над чаем
      drawSteam(ctx, cupX, cupY, time);
      break;

    case 1: // РАМЕН
      ctx.fillStyle = '#09090b'; ctx.beginPath(); ctx.arc(scx, scy, 14, 0, Math.PI*2); ctx.fill(); // Миска
      ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(scx, scy, 11, 0, Math.PI*2); ctx.fill(); // Бульон
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(scx - 4, scy - 3, 4, 0, Math.PI*2); ctx.fill(); // Яйцо
      ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(scx - 3, scy - 2, 2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#16a34a'; // Зелень
      ctx.beginPath(); ctx.arc(scx + 2, scy + 3, 1.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(scx + 5, scy + 1, 1.5, 0, Math.PI*2); ctx.fill();
      
      // Палочки
      ctx.fillStyle = '#fcd34d'; 
      ctx.save(); ctx.translate(scx - 12, scy + 8); ctx.rotate(-0.1);
      ctx.fillRect(0, 0, 28, 2); ctx.fillRect(2, 3, 28, 2); ctx.restore();
      
      // Пар
      drawSteam(ctx, scx, scy, time);
      break;

    case 2: // ЧАЙНАЯ ЦЕРЕМОНИЯ
      // Чайник
      ctx.fillStyle = '#92400e'; ctx.beginPath(); ctx.arc(scx - 5, scy + 2, 9, 0, Math.PI*2); ctx.fill();
      // Ручка чайника (Исправлено)
      ctx.beginPath(); ctx.moveTo(scx - 10, scy); ctx.quadraticCurveTo(scx - 20, scy - 5, scx - 14, scy + 8); 
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#78350f'; ctx.stroke();
      // Крышка
      ctx.fillStyle = '#78350f'; ctx.beginPath(); ctx.arc(scx - 5, scy + 2, 4, 0, Math.PI*2); ctx.fill();
      
      const drawCup = (dcx: number, dcy: number) => {
          ctx.fillStyle = '#f5f5f4'; ctx.beginPath(); ctx.arc(dcx, dcy, 4, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#65a30d'; ctx.beginPath(); ctx.arc(dcx, dcy, 2.5, 0, Math.PI*2); ctx.fill(); 
          drawSteam(ctx, dcx, dcy, time);
      };
      drawCup(scx + 10, scy - 5);
      drawCup(scx + 12, scy + 8);
      break;

    case 3: // САШИМИ
      ctx.save(); ctx.translate(scx, scy); ctx.rotate(0.2);
      ctx.fillStyle = '#fdba74'; drawRoundedRect(ctx, -14, -8, 28, 16, 2); ctx.fill(); // Доска
      ctx.fillStyle = '#ef4444'; drawRoundedRect(ctx, -10, -6, 8, 12, 1); ctx.fill(); // Тунец
      ctx.fillStyle = '#f97316'; drawRoundedRect(ctx, 0, -6, 8, 12, 1); ctx.fill(); // Лосось
      ctx.restore();
      break;

    case 4: // МЕНЮ
      ctx.save(); ctx.translate(scx - 8, scy); ctx.rotate(-0.1);
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(-8, -10, 16, 20); // Лист
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(-6, -7, 12, 2); ctx.fillRect(-6, -3, 10, 2); ctx.restore(); // Текст
      ctx.fillStyle = '#171717'; drawRoundedRect(ctx, scx + 8, scy - 8, 6, 12, 2); ctx.fill(); // Бутылочка
      ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.arc(scx + 11, scy - 10, 3, 0, Math.PI*2); ctx.fill(); // Крышка
      break;

    case 5: // ТЕМПУРА
      ctx.save(); ctx.translate(scx, scy); ctx.rotate(-0.1);
      ctx.fillStyle = '#fde047'; drawRoundedRect(ctx, -14, -8, 28, 16, 2); ctx.fill(); // Доска
      // Креветки
      ctx.fillStyle = '#d97706'; ctx.beginPath(); ctx.ellipse(-5, -2, 10, 4, 0.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.ellipse(5, 2, 10, 4, 0.3, 0, Math.PI*2); ctx.fill();
      ctx.restore();
      break;

    case 6: // ВАГЮ ГРИЛЬ
      ctx.fillStyle = '#262626'; drawRoundedRect(ctx, scx - 12, scy - 10, 24, 20, 3); ctx.fill(); // Гриль
      // Решетка
      ctx.strokeStyle = '#525252'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(scx-10, scy); ctx.lineTo(scx+10, scy); ctx.stroke();
      
      const drawMeat = (mx: number, my: number) => {
          ctx.fillStyle = '#991b1b'; ctx.fillRect(mx, my, 8, 5); // Мясо
          // Шкворчание
          if (Math.random() > 0.5) {
              ctx.fillStyle = '#fbbf24';
              ctx.fillRect(mx + Math.random()*8, my + Math.random()*5, 1, 1);
          }
      };
      drawMeat(scx - 8, scy - 6); 
      drawMeat(scx + 2, scy - 2);
      
      // Дымок
      drawSteam(ctx, scx, scy - 5, time, 'rgba(100, 100, 100, 0.3)');
      break;

    case 7: // САКЕ
      ctx.fillStyle = '#000000'; drawRoundedRect(ctx, scx - 12, scy - 10, 24, 20, 2); ctx.fill(); // Поднос
      // Токкури
      ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(scx - 5, scy, 6, 0, Math.PI*2); ctx.fill(); 
      // Очоко (Чашка)
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(scx + 5, scy - 4, 4, 0, Math.PI*2); ctx.fill();
      // Жидкость в чашке
      ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.arc(scx + 5, scy - 4, 2.5, 0, Math.PI*2); ctx.fill();
      break;
  }
};
