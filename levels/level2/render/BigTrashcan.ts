import { Platform } from '../types';
import { getSprite, drawRoundedRect } from './utils';

export const BIG_TRASHCAN_CONFIG = {
  SECTION_WIDTH: 40,
  HEIGHT: 75,
  COLORS: {
    BODY_LIGHT: '#f8fafc',
    BODY_MID: '#e2e8f0',
    BODY_DARK: '#94a3b8',
    METAL: '#cbd5e1',
    METAL_DARK: '#64748b'
  },
  INDICATORS: [
    { name: 'Harmful', color: '#ef4444' }, // Red
    { name: 'Kitchen', color: '#10b981' }, // Green
    { name: 'Other', color: '#334155' },   // Black
    { name: 'Recyclable', color: '#3b82f6' } // Blue
  ]
};

export const drawBigTrashcan = (ctx: CanvasRenderingContext2D, p: Platform) => {
    const key = `platform_big_trashcan_${p.width}_${p.height}`;
    const bottomMargin = 10;
    
    const sprite = getSprite(key, p.width, p.height + bottomMargin, (c) => {
        const w = p.width;
        const h = p.height;
        const sections = Math.floor(w / BIG_TRASHCAN_CONFIG.SECTION_WIDTH);
        
        // Shadow
        c.fillStyle = 'rgba(0,0,0,0.15)';
        c.beginPath(); c.ellipse(w/2, h, w/2, 4, 0, 0, Math.PI*2); c.fill();

        for (let i = 0; i < sections; i++) {
            const sx = i * BIG_TRASHCAN_CONFIG.SECTION_WIDTH;
            const sw = BIG_TRASHCAN_CONFIG.SECTION_WIDTH;
            const indicator = BIG_TRASHCAN_CONFIG.INDICATORS[i % BIG_TRASHCAN_CONFIG.INDICATORS.length];

            // Main Body (Silver/Metal)
            const bodyGrad = c.createLinearGradient(sx, 0, sx + sw, 0);
            bodyGrad.addColorStop(0, BIG_TRASHCAN_CONFIG.COLORS.BODY_MID);
            bodyGrad.addColorStop(0.3, BIG_TRASHCAN_CONFIG.COLORS.BODY_LIGHT);
            bodyGrad.addColorStop(1, BIG_TRASHCAN_CONFIG.COLORS.BODY_DARK);
            
            c.fillStyle = bodyGrad;
            drawRoundedRect(c, sx, 0, sw - 1, h, 2); c.fill();
            
            // Top colored hood
            c.fillStyle = indicator.color;
            drawRoundedRect(c, sx + 2, 2, sw - 5, 20, 1); c.fill();
            
            // Opening (Black hole)
            c.fillStyle = '#0f172a';
            drawRoundedRect(c, sx + 6, 6, sw - 13, 12, 1); c.fill();
            
            // Label panel
            c.fillStyle = 'white';
            c.fillRect(sx + 8, 30, sw - 17, 30);
            c.strokeStyle = '#e2e8f0';
            c.lineWidth = 1;
            c.strokeRect(sx + 8, 30, sw - 17, 30);
            
            // Icon placeholder
            c.fillStyle = indicator.color;
            c.fillRect(sx + sw/2 - 4, 38, 8, 8);
            c.fillStyle = '#94a3b8';
            c.fillRect(sx + 12, 52, sw - 25, 2);
            
            // Base/Kickplate
            c.fillStyle = '#1e293b';
            c.fillRect(sx + 2, h - 8, sw - 5, 8);
        }

        // Top edge highlight for the platform
        c.fillStyle = 'rgba(255,255,255,0.3)';
        c.fillRect(0, 0, w, 2);
    });

    ctx.drawImage(sprite, p.x, p.y);
};