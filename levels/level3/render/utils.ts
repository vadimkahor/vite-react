
// Хелпер для рисования скругленного прямоугольника
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

// Хелпер для текстуры дерева (оптимизирован для уменьшения шума)
export const drawWoodGrain = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip(); 

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)'; // Очень мягкая прозрачность
    ctx.lineWidth = 1.0;
    
    // Рисуем редкие и плавные линии
    const density = 16; 
    for (let i = -20; i < w + 20; i += density) {
        ctx.beginPath();
        const startX = x + i;
        const endX = x + i + (Math.sin(i * 0.1) * 15);
        
        ctx.moveTo(startX, y);
        ctx.bezierCurveTo(
            startX + 10, y + h * 0.33,
            endX - 10, y + h * 0.66,
            endX, y + h
        );
        ctx.stroke();
    }
    
    // Мягкие продольные волокна
    ctx.fillStyle = 'rgba(0,0,0,0.02)';
    for(let i=0; i<3; i++) {
        const py = y + (h * 0.2) + (i * h * 0.3);
        ctx.fillRect(x, py, w, 2);
    }

    ctx.restore();
};

export const drawSpeechBubble = (ctx: CanvasRenderingContext2D, x: number, y: number, text: string, alpha: number, scale: number = 1) => {
  if (scale <= 0.01) return; 

  ctx.save();
  ctx.globalAlpha = alpha;
  
  const fontSize = 12;
  const lineHeight = 14;
  ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
  
  const lines = text.split('\n');
  let maxWidth = 0;
  lines.forEach(line => {
      const w = ctx.measureText(line).width;
      if (w > maxWidth) maxWidth = w;
  });

  const padding = 8;
  const bubbleWidth = maxWidth + padding * 2;
  const bubbleHeight = (lines.length * lineHeight) + padding * 1.5;
  
  // Центрируем пузырь над точкой x,y
  const bx = x - bubbleWidth / 2;
  const by = y - bubbleHeight - 10; 

  // Анимация зума от точки привязки
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.translate(-x, -y);

  // Хвостик
  ctx.beginPath();
  ctx.moveTo(x - 6, by + bubbleHeight);
  ctx.lineTo(x + 6, by + bubbleHeight);
  ctx.lineTo(x, by + bubbleHeight + 6);
  ctx.closePath();
  
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Тело пузыря
  drawRoundedRect(ctx, bx, by, bubbleWidth, bubbleHeight, 6);
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Текст
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  lines.forEach((line, i) => {
      ctx.fillText(line, x, by + padding + (i * lineHeight));
  });

  ctx.restore();
};
