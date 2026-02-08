
import { Platform } from '../types';
import { getSprite, drawRoundedRect } from './utils';
import { LEVEL2_CONFIG } from '../config';

export const SOFA_CONFIG = {
  WIDTH: 160,
  HEIGHT: 50, 
};

export const drawSofa = (ctx: CanvasRenderingContext2D, p: Platform) => {
    const key = `platform_sofa_${p.width}_${p.height}`;
    const topMargin = 25; 
    const bottomMargin = 10;
    const totalH = p.height + topMargin + bottomMargin;
    
    const sprite = getSprite(key, p.width, totalH, (c) => {
        c.translate(0, topMargin);
        const x = 0; const y = 0; const w = p.width; const h = p.height;

        // Тень
        c.fillStyle = 'rgba(0,0,0,0.15)';
        c.beginPath(); c.ellipse(x + w/2, y + h, w/2, 6, 0, 0, Math.PI*2); c.fill();

        const cDark = LEVEL2_CONFIG.COLORS.FURNITURE_BROWN_DARK;
        const cBase = LEVEL2_CONFIG.COLORS.FURNITURE_BROWN_BASE;
        const cLight = LEVEL2_CONFIG.COLORS.FURNITURE_BROWN_LIGHT;
        const backHeight = 45; const armWidth = 25; const seatHeight = 25; const legHeight = 10;

        c.fillStyle = '#1a0500'; 
        c.fillRect(x + 10, y + h - legHeight, 10, legHeight);
        c.fillRect(x + w - 20, y + h - legHeight, 10, legHeight);

        const backY = y - backHeight + seatHeight; 
        
        const backGrad = c.createLinearGradient(x, backY, x, y + seatHeight);
        backGrad.addColorStop(0, cLight); backGrad.addColorStop(0.3, cBase); backGrad.addColorStop(1, cDark);
        c.fillStyle = backGrad;
        drawRoundedRect(c, x, backY, w, backHeight + 10, 10); c.fill();
        
        c.strokeStyle = 'rgba(0,0,0,0.15)'; c.lineWidth = 2;
        // Шов посередине спинки дивана
        c.beginPath(); c.moveTo(x + w/2, backY + 5); c.lineTo(x + w/2, backY + backHeight - 5); c.stroke();

        c.fillStyle = cDark;
        drawRoundedRect(c, x, y + h - legHeight - 15, w, 15, 4); c.fill();

        const cushionY = y; 
        const seatGrad = c.createLinearGradient(x, cushionY, x, cushionY + seatHeight);
        seatGrad.addColorStop(0, cLight); seatGrad.addColorStop(0.5, cBase); seatGrad.addColorStop(1, cDark);
        c.fillStyle = seatGrad;

        const seatX = x + armWidth; const seatW = w - (armWidth * 2);

        // Две подушки сиденья
        drawRoundedRect(c, seatX, cushionY, seatW/2 - 1, seatHeight, 8); c.fill();
        drawRoundedRect(c, seatX + seatW/2 + 1, cushionY, seatW/2 - 1, seatHeight, 8); c.fill();

        const drawArm = (ax: number) => {
             const armGrad = c.createLinearGradient(ax, cushionY - 10, ax + armWidth, cushionY - 10);
             armGrad.addColorStop(0, cBase); armGrad.addColorStop(0.4, cLight); armGrad.addColorStop(1, cDark);
             c.fillStyle = armGrad;
             drawRoundedRect(c, ax, cushionY - 15, armWidth, seatHeight + 15, 8); c.fill();
        };
        drawArm(x); drawArm(x + w - armWidth);
    });
    
    ctx.drawImage(sprite, p.x, p.y - topMargin);
};
