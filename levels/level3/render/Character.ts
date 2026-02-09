
import { LEVEL3_CONFIG } from '../config';
import { Level3State } from '../types';
import { drawSpeechBubble } from './utils';

export const drawPlayer = (ctx: CanvasRenderingContext2D, p: Level3State['player']) => {
  const pw = LEVEL3_CONFIG.PLAYER_WIDTH;

  ctx.save();
  ctx.translate(Math.floor(p.x), Math.floor(p.y - 20));
  
  const isLeft = p.dir === 'left';
  if (isLeft) {
      ctx.translate(pw, 0);
      ctx.scale(-1, 1);
  }

  const isMoving = p.isMoving;
  const animTime = p.frame / 5;
  // Уменьшена амплитуда покачивания (с 3 до 1.2)
  const bob = isMoving ? Math.sin(animTime) * 1.2 : 0;
  const CX = 5; 

  // Тело (Свитер)
  ctx.fillStyle = '#F3DBC1';
  ctx.beginPath(); ctx.moveTo(CX + 5, 20 + bob); ctx.lineTo(CX + 25, 20 + bob); ctx.lineTo(CX + 28, 50 + bob); ctx.lineTo(CX + 2, 50 + bob); ctx.fill();
  
  // Юбка
  ctx.fillStyle = '#1c1c1c'; 
  ctx.fillRect(CX + 5, 50 + bob, 20, 10);
  
  // Голова
  ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(CX + 15, 12 + bob, 10, 0, Math.PI * 2); ctx.fill();
  
  // Волосы - Рыжеватый блонд (Strawberry Blonde)
  ctx.fillStyle = '#d97706'; 
  ctx.beginPath(); ctx.moveTo(CX + 5, 5 + bob); ctx.quadraticCurveTo(CX + 15, -5 + bob, CX + 25, 5 + bob); ctx.lineTo(CX + 26, 20 + bob); ctx.lineTo(CX + 4, 20 + bob); ctx.fill();
  
  // Шарф (Галстук)
  ctx.fillStyle = '#d97706'; 
  ctx.beginPath(); ctx.moveTo(CX + 10, 22 + bob); ctx.quadraticCurveTo(CX + 15, 25 + bob, ctx.canvas.width > 0 ? 20 : 20, 22 + bob); ctx.lineTo(CX + 22, 28 + bob); ctx.lineTo(CX + 8, 28 + bob); ctx.fill();
  if (isMoving) {
      const wind = 10;
      ctx.beginPath(); ctx.moveTo(CX + 8, 25 + bob); ctx.quadraticCurveTo(CX + 8 - wind, 20 + bob, CX + 8 - wind - 5, 28 + bob + (Math.sin(animTime)*2)); ctx.lineTo(CX + 8, 28 + bob); ctx.fill();
  }
  
  ctx.restore();

  // Draw Speech Bubble
  if (p.speechBubble) {
      ctx.save();
      // Возвращаемся к глобальным координатам, но с учетом текущей позиции игрока
      ctx.translate(Math.floor(p.x), Math.floor(p.y - 20));
      
      const max = p.speechBubble.maxTimer;
      const cur = p.speechBubble.timer;
      
      let scale = 1;
      let alpha = 1;
      
      // Появление
      if (cur > max - 10) {
          scale = (max - cur) / 10;
      }
      // Исчезновение
      if (cur < 10) {
          alpha = cur / 10;
      }
      
      // Отрисовка по центру над головой (ширина игрока ~40, центр 20)
      drawSpeechBubble(ctx, 20, -10, p.speechBubble.text, alpha, scale);
      ctx.restore();
  }
};
