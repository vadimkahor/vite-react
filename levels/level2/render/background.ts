
import { BackgroundElement, Building } from '../types';
import { drawRoundedRect } from './utils';

// Helper to draw frost crystals in corners
const drawFrostCorner = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, scaleX: number, scaleY: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scaleX, scaleY);
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    // Jagged ice shape
    ctx.lineTo(0, size);
    ctx.lineTo(size * 0.2, size * 0.8);
    ctx.lineTo(size * 0.3, size * 0.9);
    ctx.lineTo(size * 0.5, size * 0.5);
    ctx.lineTo(size * 0.8, size * 0.3);
    ctx.lineTo(size * 0.9, size * 0.2);
    ctx.lineTo(size, 0);
    ctx.closePath();

    const grad = ctx.createRadialGradient(0, 0, 0, size/2, size/2, size);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Fine details (cracks)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(size * 0.6, size * 0.6);
    ctx.moveTo(size * 0.2, 0); ctx.lineTo(size * 0.5, size * 0.3);
    ctx.moveTo(0, size * 0.2); ctx.lineTo(size * 0.3, size * 0.5);
    ctx.stroke();

    ctx.restore();
};

/**
 * Draws a single window element to an offscreen canvas for caching.
 */
const cacheBackgroundElement = (el: BackgroundElement): HTMLCanvasElement => {
    const framePadding = 6; // Padding for the frame
    const canvas = document.createElement('canvas');
    // Increase canvas size to include the frame
    canvas.width = el.width + framePadding * 2;
    canvas.height = el.height + framePadding * 2;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return canvas;

    // Shift context so (0,0) becomes the top-left of the window content
    ctx.translate(framePadding, framePadding);

    const ww = el.width;
    const wh = el.height;
    // Local coordinates for content
    const wx = 0;
    const wy = 0;

    // Стекло
    const skyGrad = ctx.createLinearGradient(wx, wy, wx, wy + wh);
    skyGrad.addColorStop(0, '#60a5fa'); skyGrad.addColorStop(1, '#bfdbfe');
    ctx.fillStyle = skyGrad; ctx.fillRect(wx, wy, ww, wh);

    // Клиппинг
    ctx.save();
    ctx.beginPath(); drawRoundedRect(ctx, wx, wy, ww, wh, 2); ctx.clip();

    // Облака
    if (el.hasClouds) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        const numClouds = 2; 
        const seed = el.cloudSeed;
        
        for (let c = 0; c < numClouds; c++) {
            const cx = wx + ((seed + c * 0.3) % 1) * ww;
            const cy = wy + ((seed + c * 0.2) % 1) * (wh * 0.5); 
            const size = 15 + ((seed + c * 0.1) % 1) * 15;
            
            ctx.beginPath();
            ctx.arc(cx, cy, size, 0, Math.PI * 2);
            ctx.arc(cx + size * 0.7, cy + size * 0.2, size * 0.7, 0, Math.PI * 2);
            ctx.arc(cx - size * 0.7, cy + size * 0.2, size * 0.7, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Здания
    for (const b of el.buildings) {
        const bScreenX = wx + b.x;
        const bY = wy + wh - b.height;
        
        // Тело здания
        const bGrad = ctx.createLinearGradient(bScreenX, bY, bScreenX + b.width, bY);
        bGrad.addColorStop(0, '#1e293b'); bGrad.addColorStop(0.2, '#334155'); bGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = bGrad;
        ctx.fillRect(bScreenX, bY, b.width, b.height);
        
        // Карниз
        ctx.fillStyle = '#475569';
        ctx.fillRect(bScreenX, bY - 2, b.width, 2);

        // СНЕЖНАЯ ШАПКА НА КРЫШЕ (Зима)
        ctx.fillStyle = '#f1f5f9'; // Белый снег
        ctx.beginPath();
        // Рисуем мягкий сугроб сверху
        const snowHeight = 6 + (el.cloudSeed * 4); // Случайная высота сугроба
        ctx.moveTo(bScreenX - 2, bY - 2);
        ctx.lineTo(bScreenX - 2, bY - 2 - snowHeight);
        ctx.quadraticCurveTo(bScreenX + b.width/2, bY - 2 - snowHeight - 3, bScreenX + b.width + 2, bY - 2 - snowHeight);
        ctx.lineTo(bScreenX + b.width + 2, bY - 2);
        ctx.closePath();
        ctx.fill();

        // Окна здания
        const winW = 4; const winH = 6; const gapX = 6; const gapY = 10;
        for (let r = 0; r < b.litWindows.length; r++) {
            const winY = 10 + r * (winH + gapY);
            const row = b.litWindows[r];
            for (let c = 0; c < row.length; c++) {
                 const winX = 6 + c * (winW + gapX);
                 if (row[c]) ctx.fillStyle = '#fbbf24'; else ctx.fillStyle = '#475569'; 
                 ctx.fillRect(bScreenX + winX, bY + winY, winW, winH);
            }
        }
    }
    
    // ЭФФЕКТ ЛЬДА/МОРОЗА НА ОКНЕ
    // Рисуем в углах окна
    const frostSeed = el.cloudSeed * 10;
    const frostSizeBL = 40 + (Math.sin(frostSeed) * 15);
    const frostSizeBR = 40 + (Math.cos(frostSeed) * 15);
    
    // Левый нижний
    drawFrostCorner(ctx, wx, wy + wh, frostSizeBL, 1, -1);
    // Правый нижний
    drawFrostCorner(ctx, wx + ww, wy + wh, frostSizeBR, -1, -1);
    
    // Иногда добавляем сверху
    if (el.cloudSeed > 0.6) {
         drawFrostCorner(ctx, wx, wy, 30, 1, 1);
         drawFrostCorner(ctx, wx + ww, wy, 30, -1, 1);
    }
    
    ctx.restore();

    // Рама окна
    const frameW = 6;
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.rect(wx - frameW, wy - frameW, ww + frameW*2, wh + frameW*2);
    ctx.rect(wx, wy, ww, wh);
    ctx.fill('evenodd');
    
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
    ctx.strokeRect(wx, wy, ww, wh);
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(wx + ww/2 - 2, wy, 4, wh); 
    ctx.fillRect(wx, wy + wh/2 - 2, ww, 4);
    
    // Блик на стекле
    ctx.save();
    ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + 50, wy); ctx.lineTo(wx, wy + 50); ctx.closePath();
    const glint = ctx.createLinearGradient(wx, wy, wx+20, wy+20);
    glint.addColorStop(0, 'rgba(255,255,255,0.4)'); glint.addColorStop(1, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = glint; ctx.fill();
    ctx.restore();

    return canvas;
};

export const drawOfficeBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, cameraX: number, elements: BackgroundElement[]) => {
  // Градиент стены (статичный) - это дешево, оставляем
  const grad = ctx.createRadialGradient(width/2, height/2, 100, width/2, height/2, width);
  grad.addColorStop(0, '#cbd5e1'); // Светло-серый
  grad.addColorStop(1, '#94a3b8'); // Серый
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const parallaxX = cameraX * 0.5; 
  
  // Рисуем кэшированные элементы
  for (const el of elements) {
      const screenX = el.x - parallaxX;
      
      // Optimization: Culling
      if (screenX > width || screenX + el.width + 12 < 0) continue;

      // Lazy cache creation
      if (!el.cachedCanvas) {
          el.cachedCanvas = cacheBackgroundElement(el);
      }
      
      // Просто рисуем готовую картинку со смещением (учитываем padding рамы)
      ctx.drawImage(el.cachedCanvas, screenX - 6, el.y - 6);
  }
};
