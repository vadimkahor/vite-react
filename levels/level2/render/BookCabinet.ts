import { Platform } from '../types';
import { getSprite, drawRoundedRect } from './utils';
import { FILE_CABINET_CONFIG } from './FileCabinet';

export const BOOK_CABINET_CONFIG = {
  HEIGHT: FILE_CABINET_CONFIG.HEIGHT, // 160
  BASE_WIDTH: 80,
  COLORS: {
    FRAME: '#e2e8f0', // Slate 200 (Matches Xerox/Cabinet light parts)
    FRAME_DARK: '#94a3b8', // Slate 400
    INTERIOR: '#cbd5e1', // Slate 300 (Slightly darker for depth)
    GLASS: 'rgba(186, 230, 253, 0.12)',
    BOOK_COLORS: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#475569'],
    FOLDER: '#f8fafc',
    FOLDER_LABEL: '#94a3b8'
  }
};

export const drawBookCabinet = (ctx: CanvasRenderingContext2D, p: Platform) => {
    const key = `platform_book_cabinet_v2_${p.width}_${p.height}`;
    const sprite = getSprite(key, p.width, p.height + 10, (c) => {
        const w = p.width;
        const h = p.height;
        const frameW = 5;
        
        // Shadow
        c.fillStyle = 'rgba(0,0,0,0.1)';
        c.beginPath(); c.ellipse(w/2, h, w/2, 4, 0, 0, Math.PI*2); c.fill();

        // Main Frame
        const frameGrad = c.createLinearGradient(0, 0, w, 0);
        frameGrad.addColorStop(0, BOOK_CABINET_CONFIG.COLORS.FRAME);
        frameGrad.addColorStop(1, BOOK_CABINET_CONFIG.COLORS.FRAME_DARK);
        
        c.fillStyle = frameGrad;
        drawRoundedRect(c, 0, 0, w, h, 2); c.fill();
        c.strokeStyle = BOOK_CABINET_CONFIG.COLORS.FRAME_DARK;
        c.lineWidth = 1;
        c.stroke();

        // Interior
        c.fillStyle = BOOK_CABINET_CONFIG.COLORS.INTERIOR;
        c.fillRect(frameW, frameW, w - frameW * 2, h - frameW * 2);

        // Shelves
        const shelfCount = 4;
        const shelfH = (h - frameW * 2) / shelfCount;
        
        for (let i = 0; i < shelfCount; i++) {
            const sy = frameW + i * shelfH;
            
            // Shelf board
            c.fillStyle = BOOK_CABINET_CONFIG.COLORS.FRAME_DARK;
            c.fillRect(frameW, sy + shelfH - 4, w - frameW * 2, 4);

            // Populate with items
            let currentItemX = frameW + 2;
            const maxItemX = w - frameW - 5;
            let seed = (i * 10) + (w * 7);

            while (currentItemX < maxItemX) {
                const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
                const itemType = rnd(); // 0-0.6 books, 0.6-0.9 folders, 0.9-1.0 gap
                
                if (itemType < 0.6) {
                    const bw = 3 + rnd() * 5;
                    const bh = shelfH * 0.6 + rnd() * (shelfH * 0.25);
                    c.fillStyle = BOOK_CABINET_CONFIG.COLORS.BOOK_COLORS[Math.floor(rnd() * BOOK_CABINET_CONFIG.COLORS.BOOK_COLORS.length)];
                    c.fillRect(currentItemX, sy + shelfH - 4 - bh, bw, bh);
                    currentItemX += bw + 1;
                } else if (itemType < 0.9) {
                    const fw = 8;
                    const fh = shelfH * 0.7;
                    c.fillStyle = BOOK_CABINET_CONFIG.COLORS.FOLDER;
                    c.fillRect(currentItemX, sy + shelfH - 4 - fh, fw, fh);
                    // Label strip
                    c.fillStyle = BOOK_CABINET_CONFIG.COLORS.FOLDER_LABEL;
                    c.fillRect(currentItemX + 2, sy + shelfH - 4 - fh + 4, fw - 4, 3);
                    currentItemX += fw + 2;
                } else {
                    currentItemX += 10 + rnd() * 15;
                }
            }
        }

        // Glass Doors (Simplified: Draw frame and reflection)
        c.fillStyle = BOOK_CABINET_CONFIG.COLORS.GLASS;
        c.fillRect(frameW, frameW, w - frameW * 2, h - frameW * 2);
        
        // Middle divider for doors
        c.fillStyle = BOOK_CABINET_CONFIG.COLORS.FRAME;
        c.fillRect(w/2 - 1, frameW, 2, h - frameW * 2);

        // Door Knobs
        c.fillStyle = '#64748b';
        c.beginPath(); c.arc(w/2 - 3, h/2, 2, 0, Math.PI*2); c.fill();
        c.beginPath(); c.arc(w/2 + 3, h/2, 2, 0, Math.PI*2); c.fill();

        // Reflection glint
        c.strokeStyle = 'rgba(255,255,255,0.15)';
        c.lineWidth = 1;
        c.beginPath(); c.moveTo(frameW + 10, frameW + 10); c.lineTo(w/2 - 5, frameW + 40); c.stroke();
        c.beginPath(); c.moveTo(w/2 + 10, h - frameW - 40); c.lineTo(w - frameW - 10, h - frameW - 10); c.stroke();

        // Base kickplate
        c.fillStyle = BOOK_CABINET_CONFIG.COLORS.FRAME_DARK;
        c.fillRect(0, h - 10, w, 10);
    });

    ctx.drawImage(sprite, p.x, p.y);
};