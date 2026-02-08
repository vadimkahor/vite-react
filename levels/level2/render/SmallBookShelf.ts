
import { Platform } from '../types';
import { getSprite, drawRoundedRect } from './utils';

export const SMALL_BOOK_SHELF_CONFIG = {
  WIDTH: 80,         
  HEIGHT: 10 // В 2 раза тоньше чем обычная платформа (20 -> 10)
};

export const drawSmallBookShelf = (ctx: CanvasRenderingContext2D, p: Platform) => {
    const key = `platform_small_bookshelf_${p.width}_${p.height}`;
    const bottomMargin = 15;
    
    const sprite = getSprite(key, p.width, p.height + bottomMargin, (c) => {
        const x = 0; const y = 0; const w = p.width; const h = p.height;
        
        // Тень
        c.fillStyle = 'rgba(0,0,0,0.15)';
        c.beginPath(); c.ellipse(x + w/2, y + h, w/2, 6, 0, 0, Math.PI*2); c.fill();

        // Основа полки
        c.fillStyle = '#94a3b8'; 
        drawRoundedRect(c, x + 2, y + 2, w, h, 2); 
        c.fill();
        
        const woodGrad = c.createLinearGradient(x, y, x, y + h);
        woodGrad.addColorStop(0, '#f1f5f9'); 
        woodGrad.addColorStop(1, '#cbd5e1');
        c.fillStyle = woodGrad; 
        drawRoundedRect(c, x, y, w, h, 2); 
        c.fill();
        
        // Крепления (ножки) - короче чем у обычной платформы так как сама полка тоньше
        c.fillStyle = '#64748b'; 
        c.fillRect(x + 10, y + h, 5, 8); 
        c.fillRect(x + w - 15, y + h, 5, 8);
    });

    ctx.drawImage(sprite, p.x, p.y);
};
