
// --- Кэш спрайтов ---
export const spriteCache: Record<string, HTMLCanvasElement> = {};
const glowCache: Record<string, HTMLCanvasElement> = {};

export const clearSpriteCache = () => {
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

export const drawSpeechBubble = (ctx: CanvasRenderingContext2D, x: number, y: number, text: string, alpha: number, scale: number = 1, alignLeft: boolean = false) => {
  if (scale <= 0.01) return; 

  ctx.save();
  ctx.globalAlpha = alpha;
  
  const fontSize = 14;
  const lineHeight = 18;
  ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
  
  const lines = text.split('\n');
  let maxWidth = 0;
  lines.forEach(line => {
      const w = ctx.measureText(line).width;
      if (w > maxWidth) maxWidth = w;
  });

  const padding = 10;
  const bubbleWidth = maxWidth + padding * 2;
  const bubbleHeight = (lines.length * lineHeight) + padding * 1.5;
  
  // Увеличиваем отступы для босса (alignLeft), чтобы не перекрывать голову
  const offsetX = alignLeft ? 60 : 25; 
  const offsetY = alignLeft ? 50 : 25;
  
  const bx = alignLeft ? x - bubbleWidth - offsetX : x + offsetX; 
  const by = y - bubbleHeight - offsetY; 

  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.translate(-x, -y);

  // Tail
  ctx.beginPath();
  if (alignLeft) {
      const tailBaseX = bx + bubbleWidth - 5;
      ctx.moveTo(tailBaseX - 15, by + bubbleHeight);
      ctx.lineTo(x - 10, y - 20); 
      ctx.lineTo(tailBaseX, by + bubbleHeight);
  } else {
      const tailBaseX = bx + 5;
      ctx.moveTo(tailBaseX + 15, by + bubbleHeight);
      ctx.lineTo(x + 5, y - 15); 
      ctx.lineTo(tailBaseX, by + bubbleHeight);
  }
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
  ctx.textBaseline = 'top';
  
  lines.forEach((line, i) => {
      ctx.fillText(line, bx + padding, by + padding + (i * lineHeight));
  });

  ctx.restore();
};

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
