
import { LEVEL2_CONFIG } from './config';
import { Level2State } from './types';
import { drawRoundedRect } from './render/utils';
import { drawOfficeBackground } from './render/background';
import { drawPlatform } from './render/furniture';
import { drawDecoration } from './render/Decorations';
import { drawKatya } from './render/character';
import { drawSecurity } from './enemies/Security';
import { drawSecretary } from './enemies/Secretary';

// OPTIMIZATION: Cached gradient for speed lines
let cachedSpeedLineGrad: HTMLCanvasElement | null = null;
const getSpeedLineGradient = (): HTMLCanvasElement => {
    if (cachedSpeedLineGrad) return cachedSpeedLineGrad;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 256, 0);
        grad.addColorStop(0, `rgba(255, 255, 255, 0)`);
        grad.addColorStop(0.5, `rgba(255, 255, 255, 1)`);
        grad.addColorStop(1, `rgba(255, 255, 255, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 1);
    }
    cachedSpeedLineGrad = canvas;
    return canvas;
};

/**
 * Главная функция отрисовки уровня 2
 */
export const drawLevel2 = (
  ctx: CanvasRenderingContext2D, 
  state: Level2State, 
  width: number, 
  height: number
) => {
  const { player, platforms, decorations, enemies, boss, projectiles, backgroundElements, cameraX, score, gameTime, speedLines } = state;
  const floorY = height - LEVEL2_CONFIG.FLOOR_HEIGHT;

  // 1. Очистка
  ctx.clearRect(0, 0, width, height);

  // 2. Фон (Окна с параллаксом)
  drawOfficeBackground(ctx, width, height, cameraX, backgroundElements);

  ctx.save();
  ctx.translate(-Math.floor(cameraX), 0);

  // 3. Пол
  ctx.fillStyle = LEVEL2_CONFIG.COLORS.FLOOR;
  ctx.fillRect(Math.floor(cameraX), floorY, width, LEVEL2_CONFIG.FLOOR_HEIGHT);
  
  // Детали пола
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  const tileSize = 120;
  const startTile = Math.floor(cameraX / tileSize) * tileSize;
  for(let x = startTile; x < cameraX + width; x += tileSize) {
      ctx.fillRect(x, floorY, 2, LEVEL2_CONFIG.FLOOR_HEIGHT);
  }

  // 4. Выходная дверь
  if (state.levelLength) {
     const exitX = state.levelLength;
     ctx.fillStyle = '#334155';
     drawRoundedRect(ctx, exitX - 10, floorY - 190, 120, 190, 4); ctx.fill();
     ctx.fillStyle = '#0f172a'; 
     ctx.fillRect(exitX, floorY - 180, 100, 180);
     
     ctx.fillStyle = 'rgba(0,0,0,0.5)';
     ctx.fillRect(exitX + 20, floorY - 140, 60, 25);
     ctx.fillStyle = '#10b981'; 
     ctx.font = 'bold 14px sans-serif';
     ctx.textAlign = 'center';
     ctx.fillText('EXIT', exitX + 50, floorY - 122);
     
     const grad = ctx.createLinearGradient(exitX, floorY, exitX, floorY + 20);
     grad.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
     grad.addColorStop(1, 'transparent');
     ctx.fillStyle = grad;
     ctx.fillRect(exitX, floorY, 100, 20);
  }

  // 5. Платформы
  const cullBuffer = 200;
  for (const plat of platforms) {
      if (plat.x + plat.width + cullBuffer < cameraX || plat.x - cullBuffer > cameraX + width) continue;
      drawPlatform(ctx, plat, gameTime);
  }

  // 6. Декорации
  for (const deco of decorations) {
      if (deco.x + 150 < cameraX || deco.x - 150 > cameraX + width) continue;
      drawDecoration(ctx, deco);
  }

  // 7. Enemies (Security Guards)
  for (const enemy of enemies) {
      if (enemy.x + enemy.width + 100 < cameraX || enemy.x - 100 > cameraX + width) continue;
      drawSecurity(ctx, enemy);
  }

  // BOSS
  if (boss) {
      if (boss.x + boss.width > cameraX && boss.x < cameraX + width) {
          drawSecretary(ctx, boss.x, boss.y, boss.variant, boss.frameTimer);
      }
  }

  // Projectiles (Paper Stacks)
  for (const p of projectiles) {
      if (p.x + p.width < cameraX || p.x > cameraX + width) continue;
      
      ctx.save();
      ctx.translate(p.x + p.width/2, p.y + p.height/2);
      ctx.rotate(p.rotation);
      
      // Draw flying papers
      ctx.fillStyle = '#ffffff';
      drawRoundedRect(ctx, -p.width/2, -p.height/2, p.width, p.height, 2); ctx.fill();
      
      // Pages detail
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-p.width/2 + 2, -p.height/2 + 4, p.width - 4, 1);
      ctx.fillRect(-p.width/2 + 2, -p.height/2 + 8, p.width - 4, 1);
      ctx.fillRect(-p.width/2 + 2, -p.height/2 + 12, p.width - 4, 1);
      
      // Motion blur trail (simple)
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(p.width/2, -p.height/2 + 2, 10, p.height - 4);

      ctx.restore();
  }

  // 8. Игрок
  if (player.invulnerableTimer > 0 && Math.floor(gameTime / 4) % 2 === 0) {
      // Blink effect: Don't draw every other frame block
  } else {
      drawKatya(ctx, player);
  }

  // 9. Эффект скорости (Ветер)
  ctx.save();
  ctx.globalCompositeOperation = 'screen'; 
  
  const speedGrad = getSpeedLineGradient();
  
  for (const line of speedLines) {
      if (line.x + (line.isVertical ? 10 : line.length) < cameraX || line.x > cameraX + width) continue;
      
      ctx.globalAlpha = line.opacity * 0.8;
      
      if (line.isVertical) {
          // Rotate 90 deg for vertical lines
          ctx.save();
          ctx.translate(line.x, line.y);
          ctx.rotate(Math.PI / 2);
          ctx.drawImage(speedGrad, 0, 0, line.length, 2); 
          ctx.restore();
      } else {
          // Horizontal lines
          ctx.drawImage(speedGrad, line.x, line.y, line.length, 2);
      }
  }
  ctx.restore();

  ctx.restore();
};
