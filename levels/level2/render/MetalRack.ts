
import { Platform } from '../types';
import { getSprite, drawRoundedRect } from './utils';
import { FILE_CABINET_CONFIG } from './FileCabinet';

// Конфигурация металлического стеллажа
export const METAL_RACK_CONFIG = {
  HEIGHT: FILE_CABINET_CONFIG.HEIGHT, // 160
  BASE_WIDTH: FILE_CABINET_CONFIG.WIDTH, // 80
  COLORS: {
    POST: '#475569', // Темно-серые стойки
    SHELF: '#94a3b8', // Светло-серые полки
    SHELF_SIDE: '#64748b', // Торец полки
    CROSS_BRACE: '#cbd5e1', // Светлая крестовина сзади
    BOX_CARDBOARD: '#d4a373', // Цвет коробок
    BOX_TAPE: '#e9c46a' // Скотч
  }
};

export const drawMetalRack = (ctx: CanvasRenderingContext2D, p: Platform) => {
    const key = `platform_metal_rack_${p.width}_${p.height}`;
    
    const sprite = getSprite(key, p.width, p.height, (c) => {
        const w = p.width;
        const h = p.height;
        const postW = 5;
        const shelfH = 4;
        
        // 1. Задняя крестовина (Cross Brace)
        c.strokeStyle = METAL_RACK_CONFIG.COLORS.CROSS_BRACE;
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(postW, postW);
        c.lineTo(w - postW, h - postW);
        c.moveTo(w - postW, postW);
        c.lineTo(postW, h - postW);
        c.stroke();

        // 2. Стойки (4 Vertical Posts)
        c.fillStyle = METAL_RACK_CONFIG.COLORS.POST;
        // Передние (рисуем полностью) и Задние (можно было бы сделать темнее, но в 2D просто рисуем стойки по краям)
        c.fillRect(0, 0, postW, h); // Левая
        c.fillRect(w - postW, 0, postW, h); // Правая

        // 3. Полки (Shelves) - 4 уровня + верхняя
        const shelfCount = 4;
        const shelfSpacing = (h - shelfH) / shelfCount;

        for (let i = 0; i <= shelfCount; i++) {
            const sy = Math.floor(i * shelfSpacing);
            
            // Если это верхняя полка (платформа), делаем её чуть толще визуально
            const currentShelfH = (i === 0) ? shelfH + 2 : shelfH;
            
            // Торец полки
            c.fillStyle = METAL_RACK_CONFIG.COLORS.SHELF_SIDE;
            c.fillRect(postW, sy, w - (postW * 2), currentShelfH);
            
            // Верхняя плоскость полки (вид чуть сверху)
            if (i > 0) {
                 c.fillStyle = '#cbd5e1'; // Светлее
                 c.fillRect(postW, sy - 3, w - (postW * 2), 3);
            }
            
            // Тени под полками
            if (i > 0) {
                c.fillStyle = 'rgba(0,0,0,0.1)';
                c.fillRect(postW, sy + currentShelfH, w - (postW*2), 4);
            }
        }

        // 4. Декоративные коробки на полках (только для визуала)
        // Рисуем на нижних полках
        const drawBox = (bx: number, by: number, bw: number, bh: number) => {
            c.fillStyle = METAL_RACK_CONFIG.COLORS.BOX_CARDBOARD;
            drawRoundedRect(c, bx, by - bh, bw, bh, 2); c.fill();
            // Скотч
            c.fillStyle = 'rgba(0,0,0,0.1)'; c.fillRect(bx + bw/2 - 2, by - bh, 4, bh);
        };

        const bottomShelfY = h - 5;
        const middleShelfY = h - shelfSpacing - 5;
        const upperShelfY = h - (shelfSpacing * 2) - 5;

        // Генерация коробок детерминирована шириной
        const seed = p.width; 
        
        // Внизу
        drawBox(postW + 5, bottomShelfY, 25, 20);
        drawBox(postW + 35, bottomShelfY, 25, 20);
        if (w > 100) drawBox(postW + 65, bottomShelfY, 30, 25);
        
        // Посередине
        if (seed % 2 === 0) {
             drawBox(w - postW - 35, middleShelfY, 30, 18);
        } else {
             drawBox(postW + 10, middleShelfY, 20, 15);
             drawBox(postW + 32, middleShelfY, 20, 15);
        }
        
        // Сверху (редко)
        if (w > 120) {
             drawBox(w/2 - 15, upperShelfY, 30, 20);
        }

        // Верхняя поверхность (ПЛАТФОРМА)
        // Рисуем финальный слой верхней полки поверх всего, чтобы было чисто
        c.fillStyle = METAL_RACK_CONFIG.COLORS.SHELF;
        c.fillRect(0, 0, w, 6);
    });

    ctx.drawImage(sprite, p.x, p.y);
};
