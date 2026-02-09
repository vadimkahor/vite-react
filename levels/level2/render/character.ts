
import { PlayerState } from '../types';

export const drawKatya = (ctx: CanvasRenderingContext2D, p: PlayerState) => {
  ctx.save();
  ctx.translate(Math.floor(p.x), Math.floor(p.y));
  
  // Отражение если смотрит влево
  if (!p.facingRight) {
      ctx.translate(p.width, 0);
      ctx.scale(-1, 1);
  }

  // Анимация шага с использованием frameTimer для синхронизации с timeScale
  const isMoving = Math.abs(p.vx) > 0.5;
  // Делим frameTimer, чтобы получить комфортную скорость анимации
  const animTime = p.frameTimer / 5;
  const bob = isMoving && p.isGrounded ? Math.sin(animTime) * 3 : 0;
  
  // 1. Тело (Свитер)
  ctx.fillStyle = '#F3DBC1'; 
  ctx.beginPath();
  ctx.moveTo(5, 20 + bob);
  ctx.lineTo(25, 20 + bob);
  ctx.lineTo(28, 50 + bob);
  ctx.lineTo(2, 50 + bob);
  ctx.fill();

  // 2. Юбка
  ctx.fillStyle = '#1c1c1c';
  ctx.fillRect(5, 50 + bob, 20, 10);

  // 3. Ноги
  ctx.fillStyle = '#0f172a'; // Колготки (Темные)
  // Левая нога
  const legOffsetL = isMoving ? Math.sin(animTime * 0.5) * 5 : 0;
  const legOffsetR = isMoving ? Math.cos(animTime * 0.5) * 5 : 0;
  
  if (!p.isGrounded) {
      // Поза прыжка
      ctx.fillRect(8, 60, 4, 15); // Согнута
      ctx.fillRect(18, 55, 4, 12); // Поджата
  } else {
      ctx.fillRect(8 + legOffsetL, 60, 4, p.height - 60);
      ctx.fillRect(18 + legOffsetR, 60, 4, p.height - 60);
  }

  // 4. Голова
  ctx.fillStyle = '#fde047'; // Светлая кожа
  ctx.beginPath();
  ctx.arc(15, 12 + bob, 10, 0, Math.PI * 2);
  ctx.fill();

  // 5. Волосы (Каре) - Рыжеватый блонд (Strawberry Blonde)
  ctx.fillStyle = '#d97706'; 
  ctx.beginPath();
  ctx.moveTo(5, 5 + bob);
  ctx.quadraticCurveTo(15, -5 + bob, 25, 5 + bob);
  ctx.lineTo(26, 20 + bob);
  ctx.lineTo(4, 20 + bob);
  ctx.fill();

  // 6. Шарфик (Галстук)
  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.moveTo(10, 22 + bob);
  ctx.quadraticCurveTo(15, 25 + bob, 20, 22 + bob);
  ctx.lineTo(22, 28 + bob);
  ctx.lineTo(8, 28 + bob);
  ctx.fill();
  
  // Хвост шарфа
  if (isMoving || !p.isGrounded) {
      const wind = p.vx * 2;
      ctx.beginPath();
      ctx.moveTo(8, 25 + bob);
      // Шарф тоже анимируем через frameTimer
      ctx.quadraticCurveTo(8 - wind, 20 + bob, 8 - wind - 5, 28 + bob + (Math.sin(animTime)*2));
      ctx.lineTo(8, 28 + bob);
      ctx.fill();
  }

  ctx.restore();
};
