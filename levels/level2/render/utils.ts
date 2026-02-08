
// --- Кэш спрайтов ---
export const spriteCache: Record<string, HTMLCanvasElement> = {};
const glowCache: Record<string, HTMLCanvasElement> = {};

export const clearSpriteCache = () => {
    // Очищаем объект кэша.
    // JS Garbage Collector сам удалит Canvas элементы, если на них нет ссылок.
    for (const key in spriteCache) {
        delete spriteCache[key];
    }
    for (const key in glowCache) {
        delete glowCache[key];
    }
};

export const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
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

/**
 * Получает кэшированный спрайт или создает его, если он не существует.
 */
export const getSprite = (key: string, width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement => {
    if (!spriteCache[key]) {
        const cvs = document.createElement('canvas');
        cvs.width = width;
        cvs.height = height;
        const ctx = cvs.getContext('2d');
        if (ctx) drawFn(ctx);
        spriteCache[key] = cvs;
    }
    return spriteCache[key];
};

/**
 * Создает спрайт радиального свечения для замены дорогого shadowBlur.
 */
export const getGlowSprite = (color: string, size: number): HTMLCanvasElement => {
    const key = `glow_${color}_${size}`;
    if (glowCache[key]) return glowCache[key];

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
        const center = size / 2;
        const grad = ctx.createRadialGradient(center, center, 0, center, center, center / 2);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
    }

    glowCache[key] = canvas;
    return canvas;
};
