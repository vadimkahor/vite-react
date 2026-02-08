
import { Platform } from '../types';
import { getSprite, drawRoundedRect } from './utils';
import { PLATFORM_CONFIG } from './Platform';

// Высота рассчитывается так: Высота стола (60) + Отступ полки (100) = 160.
// Это позволяет шкафу стоять на полу и касаться верхом линии полок.
export const FILE_CABINET_CONFIG = {
  WIDTH: PLATFORM_CONFIG.WIDTH, // 80
  HEIGHT: 160, 
  COLORS: {
    // Убавили яркость блика (было #e2e8f0 -> #cbd5e1) и сделали базу чуть темнее для матовости
    METAL_LIGHT: '#cbd5e1', 
    METAL_BASE: '#64748b',  
    METAL_DARK: '#475569',  
    LABEL: '#f8fafc',       
    HANDLE: '#94a3b8'       
  }
};

export const drawFileCabinet = (ctx: CanvasRenderingContext2D, p: Platform) => {
    const key = `platform_filecabinet_${p.width}_${p.height}`;
    
    const sprite = getSprite(key, p.width, p.height, (c) => {
        const w = p.width;
        const h = p.height;
        
        // 1. Основной корпус (Матовый металлический градиент)
        const bodyGrad = c.createLinearGradient(0, 0, w, 0);
        bodyGrad.addColorStop(0, FILE_CABINET_CONFIG.COLORS.METAL_BASE);
        bodyGrad.addColorStop(0.15, FILE_CABINET_CONFIG.COLORS.METAL_LIGHT); // Мягкий блик
        bodyGrad.addColorStop(0.4, FILE_CABINET_CONFIG.COLORS.METAL_BASE);
        bodyGrad.addColorStop(1, FILE_CABINET_CONFIG.COLORS.METAL_DARK);
        
        c.fillStyle = bodyGrad;
        drawRoundedRect(c, 0, 0, w, h, 4);
        c.fill();
        
        // Контур корпуса
        c.strokeStyle = FILE_CABINET_CONFIG.COLORS.METAL_DARK;
        c.lineWidth = 2;
        c.stroke();

        // 2. Ящики (4 штуки)
        const drawerCount = 4;
        const padding = 6;
        const drawerH = (h - (padding * (drawerCount + 1))) / drawerCount;
        
        for (let i = 0; i < drawerCount; i++) {
            const dy = padding + i * (drawerH + padding);
            const dx = padding;
            const dw = w - (padding * 2);
            
            // Тень/Щель ящика
            c.fillStyle = 'rgba(0,0,0,0.15)';
            drawRoundedRect(c, dx + 2, dy + 2, dw, drawerH, 2);
            c.fill();

            // Лицевая панель ящика (менее контрастный градиент)
            const drawerGrad = c.createLinearGradient(dx, dy, dx, dy + drawerH);
            drawerGrad.addColorStop(0, FILE_CABINET_CONFIG.COLORS.METAL_LIGHT); 
            drawerGrad.addColorStop(1, FILE_CABINET_CONFIG.COLORS.METAL_BASE);
            c.fillStyle = drawerGrad;
            
            drawRoundedRect(c, dx, dy, dw, drawerH, 2);
            c.fill();
            
            // Тонкая обводка ящика
            c.strokeStyle = 'rgba(255,255,255,0.1)';
            c.lineWidth = 1;
            c.stroke();

            // Ручка
            const handleW = dw * 0.4;
            const handleH = 6;
            const handleX = dx + (dw - handleW) / 2;
            const handleY = dy + drawerH * 0.6;
            
            c.fillStyle = FILE_CABINET_CONFIG.COLORS.HANDLE;
            // Скоба ручки
            c.beginPath();
            drawRoundedRect(c, handleX, handleY, handleW, handleH, 2);
            c.fill();
            // Тень под ручкой
            c.fillStyle = 'rgba(0,0,0,0.2)';
            c.fillRect(handleX + 2, handleY + handleH - 2, handleW - 4, 2);

            // Держатель для этикетки (сверху по центру)
            const labelW = dw * 0.3;
            const labelH = 10;
            const labelX = dx + (dw - labelW) / 2;
            const labelY = dy + drawerH * 0.2;
            
            // Металлическая рамка этикетки
            c.fillStyle = '#64748b';
            c.fillRect(labelX - 1, labelY - 1, labelW + 2, labelH + 2);
            // Сама бумажка
            c.fillStyle = FILE_CABINET_CONFIG.COLORS.LABEL;
            c.fillRect(labelX, labelY, labelW, labelH);
            
            // "Текст" на этикетке (полоски)
            c.fillStyle = '#94a3b8';
            c.fillRect(labelX + 3, labelY + 3, labelW - 6, 2);
            c.fillRect(labelX + 3, labelY + 6, labelW - 10, 2);
        }
    });

    ctx.drawImage(sprite, p.x, p.y);
};
