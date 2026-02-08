
import { LEVEL1_CONFIG } from './config';
import { GameRefs } from './types';
import { Entity } from '../../types';

// --- Кэш спрайтов ---
const vehicleCache: Record<string, HTMLCanvasElement> = {};
const glowCache: Record<string, HTMLCanvasElement> = {}; // Кэш для свечения фар
let smokeSprite: HTMLCanvasElement | null = null;

// --- Генерация спрайта дыма ---
const getSmokeSprite = (): HTMLCanvasElement => {
    if (smokeSprite) return smokeSprite;
    
    const size = 32; 
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
        const center = size / 2;
        const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
        grad.addColorStop(0, LEVEL1_CONFIG.COLORS.SMOKE);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
    }
    
    smokeSprite = canvas;
    return canvas;
};

// --- Генерация спрайта свечения (для замены shadowBlur) ---
const getGlowSprite = (color: string): HTMLCanvasElement => {
    if (glowCache[color]) return glowCache[color];

    const size = 64; // Размер пятна свечения
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
        const center = size / 2;
        // Мягкий радиальный градиент
        const grad = ctx.createRadialGradient(center, center, 2, center, center, center);
        grad.addColorStop(0, color); 
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
    }

    glowCache[color] = canvas;
    return canvas;
};

// --- Вспомогательные функции отрисовки ---

const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

const drawSpeechBubble = (ctx: CanvasRenderingContext2D, x: number, y: number, text: string, alpha: number) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  
  const fontSize = 14;
  ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
  const textMetrics = ctx.measureText(text);
  const padding = 10;
  const bubbleWidth = textMetrics.width + padding * 2;
  const bubbleHeight = fontSize + padding * 1.5;
  
  const bx = x + 20;
  const by = y - 40;

  ctx.beginPath();
  ctx.moveTo(bx + 10, by + bubbleHeight);
  ctx.lineTo(bx - 5, by + bubbleHeight + 10);
  ctx.lineTo(bx + 20, by + bubbleHeight);
  ctx.closePath();
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  drawRoundedRect(ctx, bx, by, bubbleWidth, bubbleHeight, 8);
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + padding, by + bubbleHeight / 2 + 1);

  ctx.restore();
};

/**
 * Генерирует спрайт машины (статичная часть)
 */
const getVehicleSprite = (width: number, height: number, color: string, isPlayer: boolean): HTMLCanvasElement => {
    const key = `${color}_${width}_${height}_${isPlayer}`;
    if (vehicleCache[key]) return vehicleCache[key];

    const canvas = document.createElement('canvas');
    const padding = 10;
    canvas.width = width + padding * 2;
    canvas.height = height + padding * 2;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return canvas;

    ctx.translate(padding, padding);

    const w = width;
    const h = height;

    // ТЕНЬ
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'; 
    ctx.filter = 'blur(6px)';
    ctx.fillRect(-4, 4, w + 8, h + 2);
    ctx.filter = 'none';

    // КОЛЕСА
    ctx.fillStyle = '#1e293b'; 
    const tireW = 7; const tireH = 12; const tireInset = 3;
    drawRoundedRect(ctx, -tireInset, 10, tireW, tireH, 2); ctx.fill();
    drawRoundedRect(ctx, w - tireW + tireInset, 10, tireW, tireH, 2); ctx.fill();
    drawRoundedRect(ctx, -tireInset, h - 18, tireW, tireH, 2); ctx.fill();
    drawRoundedRect(ctx, w - tireW + tireInset, h - 18, tireW, tireH, 2); ctx.fill();

    // КОРПУС
    const bodyGrad = ctx.createLinearGradient(0, 0, w, 0);
    bodyGrad.addColorStop(0, 'rgba(0,0,0,0.2)');
    bodyGrad.addColorStop(0.1, 'rgba(0,0,0,0)');
    bodyGrad.addColorStop(0.7, 'rgba(255,255,255,0.2)');
    bodyGrad.addColorStop(1, 'rgba(0,0,0,0.2)');
    drawRoundedRect(ctx, 0, 0, w, h, 8);
    ctx.fillStyle = color; ctx.fill();
    ctx.fillStyle = bodyGrad; ctx.fill();

    if (isPlayer) { ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(w/2 - 3, 0, 6, h); }

    // КАБИНА
    const cabinMarginX = 6; const cabinY = 18; const cabinH = h - 32; const cabinW = w - (cabinMarginX * 2);
    ctx.fillStyle = '#0f172a';
    drawRoundedRect(ctx, cabinMarginX, cabinY, cabinW, cabinH, 5); ctx.fill();
    ctx.fillStyle = color;
    drawRoundedRect(ctx, cabinMarginX + 1, cabinY + 6, cabinW - 2, cabinH - 10, 3); ctx.fill();
    ctx.fillStyle = bodyGrad; ctx.fill();
    if (isPlayer) { ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(w/2 - 3, cabinY + 6, 6, cabinH - 10); }

    // ОКНА
    ctx.fillStyle = 'rgba(186, 230, 253, 0.4)';
    ctx.fillRect(cabinMarginX + 2, cabinY + 1, cabinW - 4, 5);
    ctx.fillRect(cabinMarginX + 2, cabinY + cabinH - 4, cabinW - 4, 3);

    // ФАРЫ
    ctx.fillStyle = '#fef08a'; 
    ctx.beginPath(); ctx.moveTo(3, 1); ctx.lineTo(11, 1); ctx.lineTo(11, 5); ctx.lineTo(2, 4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(w - 3, 1); ctx.lineTo(w - 11, 1); ctx.lineTo(w - 11, 5); ctx.lineTo(w - 2, 4); ctx.fill();

    // СТОП-СИГНАЛЫ (Базовые темные)
    const tailY = h - 3;
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(3, tailY, 12, 3); ctx.fillRect(w - 15, tailY, 12, 3);

    vehicleCache[key] = canvas;
    return canvas;
};

const drawVehicle = (ctx: CanvasRenderingContext2D, entity: Entity, isPlayer: boolean, isBraking: boolean, steerX: number, keys: Set<string>) => {
  ctx.save();
  const tilt = (steerX / 4.8) * 0.12;
  ctx.rotate(tilt);
  const w = entity.width;
  const h = entity.height;

  // 1. Рисуем кэшированный спрайт машины
  const sprite = getVehicleSprite(w, h, entity.color, isPlayer);
  ctx.drawImage(sprite, -10, -10);

  // 2. Рисуем динамические эффекты (Оптимизировано: спрайты вместо shadowBlur)

  // СТОП-СИГНАЛЫ (Активные)
  const tailY = h - 3;
  if (isBraking) {
      // Получаем спрайт красного свечения (полупрозрачный)
      const glow = getGlowSprite('rgba(255, 0, 51, 0.8)'); 
      const glowSize = 64; 
      const glowOffset = glowSize / 2;
      
      // Рисуем свечение в режиме screen для эффекта "добавления" света
      ctx.globalCompositeOperation = 'screen'; 
      
      // Центры фар
      const leftLightX = 2 + 7; // x + width/2
      const leftLightY = tailY - 1 + 2.5;
      
      const rightLightX = w - 16 + 7;
      const rightLightY = tailY - 1 + 2.5;

      // Рисуем спрайты свечения
      ctx.drawImage(glow, leftLightX - glowOffset, leftLightY - glowOffset);
      ctx.drawImage(glow, rightLightX - glowOffset, rightLightY - glowOffset);
      
      // Возвращаем нормальный режим смешивания
      ctx.globalCompositeOperation = 'source-over';

      // Рисуем тело лампы (яркий центр)
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(2, tailY - 1, 14, 5); 
      ctx.fillRect(w - 16, tailY - 1, 14, 5);
      
      // Рисуем самый яркий блик (нить накаливания/LED)
      ctx.fillStyle = '#ff99aa'; 
      ctx.fillRect(5, tailY, 8, 3); 
      ctx.fillRect(w - 13, tailY, 8, 3);
  }

  // ПОВОРОТНИКИ
  const time = Date.now();
  const isBlinking = Math.floor(time / 200) % 2 === 0;
  const isSteeringLeft = steerX < -0.15;
  const isSteeringRight = steerX > 0.15;
  
  if (isBlinking && (isSteeringLeft || isSteeringRight)) {
    // Желтое свечение
    const glow = getGlowSprite('rgba(251, 191, 36, 0.7)'); 
    const glowSize = 50; 
    const glowOffset = glowSize / 2;
    const indW = 5; const indH = 10; const indYOffset = 3;

    const drawIndicator = (x: number, y: number) => {
      const centerX = x + indW / 2;
      const centerY = y + indH / 2;
      
      ctx.globalCompositeOperation = 'screen';
      ctx.drawImage(glow, centerX - glowOffset, centerY - glowOffset, glowSize, glowSize);
      ctx.globalCompositeOperation = 'source-over';
      
      // Тело индикатора
      ctx.fillStyle = LEVEL1_CONFIG.COLORS.INDICATOR;
      ctx.fillRect(x, y, indW, indH);
      // Блик
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(x + 1, y + 1, indW - 2, indH - 2);
    };

    if (isSteeringLeft) { 
        drawIndicator(-3, indYOffset); 
        drawIndicator(-3, h - indH - indYOffset); 
    }
    if (isSteeringRight) { 
        drawIndicator(w - 2, indYOffset); 
        drawIndicator(w - 2, h - indH - indYOffset); 
    }
  }

  // ВЫХЛОП (Огонь из трубы)
  if (isPlayer && keys.has('ArrowUp')) {
    const flicker = Math.random();
    const flameLen = 15 + flicker * 12;
    const glowSize = 25 + flicker * 10;
    
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    
    // Для огня оставим градиент, так как он очень динамичный и меняет размер каждый кадр.
    // Но так как это только у игрока (1 машина), это не сильно бьет по производительности.
    const drawFlameAt = (fx: number) => {
      const glow = ctx.createRadialGradient(fx, h, 0, fx, h + glowSize, glowSize);
      glow.addColorStop(0, 'rgba(255, 120, 0, 0.9)'); 
      glow.addColorStop(0.4, 'rgba(255, 60, 0, 0.3)'); 
      glow.addColorStop(1, 'transparent');
      
      ctx.fillStyle = glow; 
      ctx.beginPath(); 
      ctx.arc(fx, h, glowSize, 0, Math.PI * 2); 
      ctx.fill();
      
      // Ядро пламени
      ctx.fillStyle = '#fffbeb'; 
      // Вместо shadowBlur для ядра можно просто нарисовать побольше
      ctx.beginPath(); 
      ctx.moveTo(fx - 5, h); 
      ctx.lineTo(fx, h + flameLen); 
      ctx.lineTo(fx + 5, h); 
      ctx.fill(); 
    };
    
    drawFlameAt(w/2 - 7); 
    drawFlameAt(w/2 + 7);
    ctx.restore();
  }
  ctx.restore();
};

/**
 * Генерирует бесшовную текстуру снежных отвалов в память.
 */
export const generateSnowCache = (width: number, height: number): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const roadX = (width / 2) - (LEVEL1_CONFIG.ROAD_WIDTH / 2);
    const roadRight = roadX + LEVEL1_CONFIG.ROAD_WIDTH;
    const amplitude = 4.0; 

    // Фон
    ctx.fillStyle = LEVEL1_CONFIG.COLORS.SNOW_BG;
    ctx.fillRect(0, 0, width, height);

    const gradLeft = ctx.createLinearGradient(roadX, 0, 0, 0);
    gradLeft.addColorStop(0, LEVEL1_CONFIG.COLORS.SNOW_NEAR);
    gradLeft.addColorStop(1, LEVEL1_CONFIG.COLORS.SNOW_FAR);

    const gradRight = ctx.createLinearGradient(roadRight, 0, width, 0);
    gradRight.addColorStop(0, LEVEL1_CONFIG.COLORS.SNOW_NEAR);
    gradRight.addColorStop(1, LEVEL1_CONFIG.COLORS.SNOW_FAR);

    const densityScale = height / 2000;

    const getSeamlessNoise = (y: number, seed: number) => {
        const t = (y / height) * Math.PI * 2;
        const baseFreq = 1; 
        const basePhase = seed * 10;
        const base = Math.sin(t * baseFreq + basePhase) * 10;
        
        const pileFreq = Math.round(4 * densityScale);
        const pilePhase = seed * 123.45;
        const piles = Math.cos(t * pileFreq + pilePhase) * amplitude;
        
        const jagFreq1 = Math.round((40 + (seed * 3)) * densityScale);
        const jagFreq2 = Math.round((60 + (seed * 5)) * densityScale);
        const jagged = Math.sin(t * jagFreq1) * 1.5 + Math.cos(t * jagFreq2 + seed) * 1.0;
        
        return base + piles + jagged;
    };

    const layers = [
        { offset: -2, alpha: 0.25, color: LEVEL1_CONFIG.COLORS.SNOW_NEAR, isGradient: false },
        { offset: -8, alpha: 0.5, color: LEVEL1_CONFIG.COLORS.SNOW_NEAR, isGradient: false },
        { offset: -16, alpha: 1.0, color: null, isGradient: true }
    ];

    layers.forEach(layer => {
        ctx.save();
        ctx.globalAlpha = layer.alpha;

        // ЛЕВАЯ СТОРОНА
        ctx.fillStyle = layer.isGradient ? gradLeft : layer.color!;
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, 0);
        
        for (let y = 0; y <= height; y += 5) {
            const noise = getSeamlessNoise(y, 1);
            const x = roadX + layer.offset + noise;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(0, height);
        ctx.fill();

        // ПРАВАЯ СТОРОНА
        ctx.fillStyle = layer.isGradient ? gradRight : layer.color!;
        ctx.beginPath();
        ctx.moveTo(width, height);
        ctx.lineTo(width, 0);
        
        for (let y = 0; y <= height; y += 5) {
            const noise = getSeamlessNoise(y, 2); 
            const x = roadRight - layer.offset - noise;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.fill();

        ctx.restore();
    });

    return canvas;
};

// Оптимизированная отрисовка фона: рисуем только видимый участок
const drawSnowBanks = (ctx: CanvasRenderingContext2D, cache: HTMLCanvasElement, canvasHeight: number, environmentOffset: number) => {
    const texH = cache.height;
    const texW = cache.width;
    
    const shift = Math.floor(environmentOffset % texH);
    const bottomPartH = shift;
    
    if (bottomPartH > 0) {
        const srcY = texH - bottomPartH;
        const drawH = Math.min(bottomPartH, canvasHeight);
        ctx.drawImage(cache, 0, srcY, texW, drawH, 0, 0, texW, drawH);
    }
    
    const remainingH = canvasHeight - bottomPartH;
    
    if (remainingH > 0) {
        ctx.drawImage(cache, 0, 0, texW, remainingH, 0, bottomPartH, texW, remainingH);
    }
};

/**
 * Главная функция отрисовки сцены.
 */
export const drawScene = (ctx: CanvasRenderingContext2D, refs: GameRefs) => {
  const canvas = refs.canvas;
  const centerX = canvas.width / 2;
  const roadX = centerX - (LEVEL1_CONFIG.ROAD_WIDTH / 2);
  
  const SNOW_TEXTURE_HEIGHT = 3600;
  
  if (!refs.snowCache || refs.snowCache.width !== canvas.width || refs.snowCache.height !== SNOW_TEXTURE_HEIGHT) {
      refs.snowCache = generateSnowCache(canvas.width, SNOW_TEXTURE_HEIGHT); 
  }

  // Генерируем спрайт дыма один раз
  const smoke = getSmokeSprite();

  ctx.save();
  ctx.translate(refs.shake.x, refs.shake.y);

  // 1. Фон (Оптимизировано)
  if (refs.snowCache) {
      drawSnowBanks(ctx, refs.snowCache, canvas.height, refs.environmentOffset);
  }

  // 2. Дорога
  ctx.fillStyle = LEVEL1_CONFIG.COLORS.ROAD;
  ctx.fillRect(roadX, 0, LEVEL1_CONFIG.ROAD_WIDTH, canvas.height);

  // 3. Разметка
  ctx.strokeStyle = LEVEL1_CONFIG.COLORS.MARKINGS;
  ctx.setLineDash([60, 40]);
  ctx.lineDashOffset = -refs.roadOffset;
  ctx.lineWidth = 5;
  for (let i = 1; i < LEVEL1_CONFIG.LANE_COUNT; i++) {
    ctx.beginPath(); 
    ctx.moveTo(roadX + (i * LEVEL1_CONFIG.LANE_WIDTH), 0);
    ctx.lineTo(roadX + (i * LEVEL1_CONFIG.LANE_WIDTH), canvas.height); 
    ctx.stroke();
  }
  ctx.setLineDash([]);
  
  // 4. Следы торможения
  refs.skidMarks.forEach(mark => {
    ctx.save();
    ctx.fillStyle = LEVEL1_CONFIG.COLORS.SKID_MARK;
    ctx.globalAlpha = mark.opacity * 0.7;
    ctx.translate(roadX, 0); 
    ctx.fillRect(mark.x, mark.y, mark.width, mark.height);
    ctx.restore();
  });

  // 5. Линии скорости
  refs.speedLines.forEach(line => {
    ctx.save();
    ctx.strokeStyle = `rgba(220, 240, 255, ${line.opacity})`; 
    ctx.lineWidth = 3; 
    ctx.beginPath(); 
    ctx.moveTo(line.x, line.y); 
    ctx.lineTo(line.x, line.y + line.length); 
    ctx.stroke();
    ctx.restore();
  });

  // 6. Трафик
  refs.traffic.forEach(t => {
    ctx.save(); 
    ctx.translate(roadX + t.x, t.y);
    drawVehicle(ctx, t, false, (t as any).isBraking, 0, refs.keys); 
    ctx.restore();
  });

  // 7. Игрок
  const p = refs.player;
  ctx.save(); 
  ctx.translate(roadX + p.x, p.y);
  const isAtWall = p.x <= 0 || p.x >= LEVEL1_CONFIG.ROAD_WIDTH - LEVEL1_CONFIG.PLAYER_WIDTH;
  const effectiveSteer = isAtWall ? 0 : refs.playerVelocityX;

  const isInputAllowed = !refs.isIntro;
  const isBraking = isInputAllowed && refs.keys.has('ArrowDown');
  const activeKeys = isInputAllowed ? refs.keys : new Set<string>();

  drawVehicle(ctx, p, true, isBraking, effectiveSteer, activeKeys);
  ctx.restore();

  // 8. Частицы дыма (Оптимизировано: используется пул объектов)
  for (let i = 0; i < refs.particles.length; i++) {
    const pt = refs.particles[i];
    if (!pt.active) continue;

    ctx.save();
    ctx.translate(roadX + pt.x, pt.y);
    ctx.globalAlpha = pt.life;
    // Рисуем спрайт
    const spriteSize = pt.size * 2; 
    ctx.drawImage(smoke, -pt.size, -pt.size, spriteSize, spriteSize);
    ctx.restore();
  }

  // 9. Всплывающие сообщения
  refs.floatingMessages.forEach(m => {
    drawSpeechBubble(ctx, roadX + m.x, m.y, m.text, m.life);
  });

  ctx.restore(); 
};
