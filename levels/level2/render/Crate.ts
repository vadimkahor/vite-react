
import { Platform } from '../types';
import { getSprite, drawRoundedRect } from './utils';

export const CRATE_CONFIG = {
  WIDTH: 70,
  HEIGHT: 70,
  COLORS: {
    WOOD_LIGHT: '#d4a373',   // Основной цвет досок
    WOOD_DARK: '#a16207',    // Рама/Каркас
    WOOD_SHADOW: '#854d0e',  // Тени
    NAIL: '#451a03'          // Гвозди
  }
};

export const drawCrate = (ctx: CanvasRenderingContext2D, p: Platform) => {
    const key = `platform_crate_${p.width}_${p.height}`;
    const bottomMargin = 10;

    const sprite = getSprite(key, p.width, p.height + bottomMargin, (c) => {
        const w = p.width;
        const h = p.height;
        const frameSize = 8; // Толщина рамы

        // Тень под ящиком
        c.fillStyle = 'rgba(0,0,0,0.2)';
        c.beginPath(); c.ellipse(w/2, h, w/2, 4, 0, 0, Math.PI*2); c.fill();

        // 1. Заливка фона (внутренние доски)
        c.fillStyle = CRATE_CONFIG.COLORS.WOOD_LIGHT;
        drawRoundedRect(c, 0, 0, w, h, 2); 
        c.fill();

        // Текстура горизонтальных досок внутри
        c.fillStyle = 'rgba(0,0,0,0.05)';
        for(let i=1; i<5; i++) {
            c.fillRect(frameSize, i * (h/5), w - frameSize*2, 2);
        }

        // 2. Диагональная крестовина (X)
        c.strokeStyle = CRATE_CONFIG.COLORS.WOOD_DARK;
        c.lineWidth = frameSize;
        c.lineCap = 'butt'; // Чтобы углы были ровные
        
        c.beginPath();
        // Диагональ 1
        c.moveTo(frameSize, frameSize);
        c.lineTo(w - frameSize, h - frameSize);
        // Диагональ 2
        c.moveTo(w - frameSize, frameSize);
        c.lineTo(frameSize, h - frameSize);
        c.stroke();
        
        // Добавляем "объем" крестовине (светлая грань)
        c.strokeStyle = 'rgba(255,255,255,0.1)';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(frameSize + 2, frameSize);
        c.lineTo(w - frameSize + 2, h - frameSize);
        c.stroke();


        // 3. Рама (Каркас) по периметру
        // Рисуем 4 прямоугольника, чтобы имитировать сборку
        c.fillStyle = CRATE_CONFIG.COLORS.WOOD_DARK;
        
        // Верх
        c.fillRect(0, 0, w, frameSize);
        // Низ
        c.fillRect(0, h - frameSize, w, frameSize);
        // Лево
        c.fillRect(0, 0, frameSize, h);
        // Право
        c.fillRect(w - frameSize, 0, frameSize, h);

        // Блики на раме (фаска)
        c.fillStyle = 'rgba(255,255,255,0.15)';
        c.fillRect(0, 0, w, 2); // Верхний блик
        c.fillRect(0, 0, 2, h); // Левый блик

        // 4. Гвозди/Заклепки в углах
        c.fillStyle = CRATE_CONFIG.COLORS.NAIL;
        const nailOffset = frameSize / 2;
        
        const drawNail = (nx: number, ny: number) => {
            c.beginPath(); c.arc(nx, ny, 1.5, 0, Math.PI*2); c.fill();
        };

        drawNail(nailOffset, nailOffset);
        drawNail(w - nailOffset, nailOffset);
        drawNail(nailOffset, h - nailOffset);
        drawNail(w - nailOffset, h - nailOffset);
        
        // Гвозди в центре крестовины
        drawNail(w/2, h/2);
    });

    ctx.drawImage(sprite, p.x, p.y);
};
