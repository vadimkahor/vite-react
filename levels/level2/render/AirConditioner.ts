
import { Platform } from '../types';
import { getSprite, drawRoundedRect, getGlowSprite } from './utils';

export const AIR_CONDITIONER_CONFIG = {
  WIDTH: 90,         
  HEIGHT: 32 
};

export const drawAirConditioner = (ctx: CanvasRenderingContext2D, p: Platform) => {
    const key = `platform_ac_glow_${p.width}_${p.height}`;
    const bottomMargin = 15;
    
    const sprite = getSprite(key, p.width, p.height + bottomMargin, (c) => {
        const x = 0; const y = 0; const w = p.width; const h = p.height;
        
        // 1. Тень от объекта на стене
        c.fillStyle = 'rgba(0,0,0,0.15)';
        c.beginPath(); c.ellipse(x + w/2, y + h + 4, w/2 - 5, 4, 0, 0, Math.PI*2); c.fill();

        // 2. Основной корпус (Белый пластик)
        const bodyGrad = c.createLinearGradient(x, y, x, y + h);
        bodyGrad.addColorStop(0, '#ffffff');
        bodyGrad.addColorStop(0.5, '#f8fafc'); // slate-50
        bodyGrad.addColorStop(1, '#cbd5e1'); // slate-300
        
        c.fillStyle = bodyGrad;
        drawRoundedRect(c, x, y, w, h, 8); 
        c.fill();
        
        // Тонкая обводка корпуса
        c.strokeStyle = '#94a3b8'; 
        c.lineWidth = 1;
        c.stroke();

        // Линия стыка крышки (изогнутая)
        c.strokeStyle = 'rgba(0,0,0,0.05)';
        c.beginPath();
        c.moveTo(x + 2, y + 8);
        c.quadraticCurveTo(x + w/2, y + 14, x + w - 2, y + 8);
        c.stroke();

        // 3. Внутренность шторки (Темная ниша)
        const ventY = y + h - 10;
        const ventH = 8;
        c.fillStyle = '#334155'; // Темный slate
        c.beginPath();
        c.moveTo(x + 4, ventY);
        c.lineTo(x + w - 4, ventY);
        c.quadraticCurveTo(x + w - 4, ventY + ventH, x + w - 10, ventY + ventH);
        c.lineTo(x + 10, ventY + ventH);
        c.quadraticCurveTo(x + 4, ventY + ventH, x + 4, ventY);
        c.fill();

        // 4. СВЕЧЕНИЕ (HEATING MODE - Оранжевый)
        // OPTIMIZATION: Use pre-rendered glow sprite instead of shadowBlur
        const glowColor = '#f97316';
        const glowSprite = getGlowSprite(glowColor, 64);
        
        c.save();
        c.globalCompositeOperation = 'screen';
        // Center the glow sprite over the vent area
        c.drawImage(glowSprite, x + w/2 - 32, ventY + 4 - 32, 64, 64);
        c.restore();

        c.fillStyle = '#fbbf24'; // Amber-400 (Ядро света)
        // Рисуем светящуюся полосу внутри ниши
        c.beginPath();
        drawRoundedRect(c, x + 8, ventY + 2, w - 16, 3, 1);
        c.fill();

        // 5. Сама лопасть шторки (светлая, с отражением света)
        const flapY = ventY + 3;
        const flapH = 5;
        
        // Базовый цвет шторки
        c.fillStyle = '#e2e8f0';
        c.beginPath();
        c.moveTo(x + 5, flapY);
        c.lineTo(x + w - 5, flapY);
        c.lineTo(x + w - 5, flapY + flapH);
        c.lineTo(x + 5, flapY + flapH);
        c.fill();

        // Отражение оранжевого света на шторке
        const reflectGrad = c.createLinearGradient(x, flapY, x, flapY + flapH);
        reflectGrad.addColorStop(0, 'rgba(251, 146, 60, 0.6)'); // Orange-400 transparent
        reflectGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
        c.fillStyle = reflectGrad;
        c.fill();

        // 6. Логотип
        const logoW = 18;
        const logoH = 4;
        const logoX = x + (w - logoW) / 2;
        const logoY = y + h - 18;
        
        c.fillStyle = '#94a3b8'; // Подложка
        drawRoundedRect(c, logoX, logoY, logoW, logoH, 2);
        c.fill();
        c.fillStyle = '#f8fafc'; // Текст
        c.fillRect(logoX + 2, logoY + 1, logoW - 4, 2);

        // 7. Оранжевый индикатор (Дисплей справа)
        // Цифры температуры (схематично)
        c.fillStyle = 'rgba(255, 255, 255, 0.5)';
        c.font = 'bold 8px sans-serif';
        c.fillText("28°", x + w - 24, y + h - 16);

        // Точка-индикатор
        c.fillStyle = '#ea580c'; // Orange-600
        c.beginPath();
        c.arc(x + w - 10, y + h - 18, 1.5, 0, Math.PI * 2);
        c.fill();
        
        // Свечение индикатора (Small glow)
        const indGlow = getGlowSprite('#f97316', 16);
        c.save();
        c.globalCompositeOperation = 'screen';
        c.drawImage(indGlow, x + w - 10 - 8, y + h - 18 - 8, 16, 16);
        c.restore();
        
        // 8. Боковая деталь (хромированная окантовка как на референсе)
        c.strokeStyle = '#94a3b8';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(x + 8, y);
        c.quadraticCurveTo(x + 2, y + h/2, x + 8, y + h);
        c.stroke();
    });

    ctx.drawImage(sprite, p.x, p.y);
};
