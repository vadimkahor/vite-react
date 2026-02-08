
import { Platform } from '../types';
import { getSprite, drawRoundedRect } from './utils';

export const DESK_CONFIG = {
  WIDTH: 120,
  HEIGHT: 60,
  COLORS: {
    TOP_GRADIENT_START: '#f8fafc',
    TOP_GRADIENT_END: '#cbd5e1',
    LEG_GRADIENT_START: '#475569',
    LEG_GRADIENT_MID: '#94a3b8',
    LEG_GRADIENT_END: '#475569',
    DRAWER: '#334155',
    DRAWER_DETAIL: '#475569',
    HANDLE: '#cbd5e1'
  }
};

export const drawDesk = (ctx: CanvasRenderingContext2D, p: Platform) => {
    const key = `platform_desk_${p.width}_${p.height}`;
    const bottomMargin = 15;

    const sprite = getSprite(key, p.width, p.height + bottomMargin, (c) => {
        const x = 0; const y = 0; const w = p.width; const h = p.height;

        // Тень под платформой
        c.fillStyle = 'rgba(0,0,0,0.15)';
        c.beginPath(); c.ellipse(x + w/2, y + h, w/2, 6, 0, 0, Math.PI*2); c.fill();

        const deskTopH = 12;
        const legGrad = c.createLinearGradient(x, 0, x + 10, 0);
        legGrad.addColorStop(0, DESK_CONFIG.COLORS.LEG_GRADIENT_START); 
        legGrad.addColorStop(0.5, DESK_CONFIG.COLORS.LEG_GRADIENT_MID); 
        legGrad.addColorStop(1, DESK_CONFIG.COLORS.LEG_GRADIENT_END);
        
        c.fillStyle = legGrad;
        drawRoundedRect(c, x + 8, y + deskTopH, 8, h - deskTopH, 2); c.fill();
        c.save(); c.translate(w - 24, 0);
        drawRoundedRect(c, x + 8, y + deskTopH, 8, h - deskTopH, 2); c.fill();
        c.restore();

        const drawerW = 50; const drawerH = 45;
        const drawerX = x + w - drawerW - 5; const drawerY = y + deskTopH;
        c.fillStyle = DESK_CONFIG.COLORS.DRAWER; drawRoundedRect(c, drawerX, drawerY, drawerW, drawerH, 2); c.fill();
        
        c.fillStyle = DESK_CONFIG.COLORS.DRAWER_DETAIL; const dH = 18;
        drawRoundedRect(c, drawerX + 2, drawerY + 2, drawerW - 4, dH, 2); c.fill();
        drawRoundedRect(c, drawerX + 2, drawerY + dH + 4, drawerW - 4, dH, 2); c.fill();
        
        c.fillStyle = DESK_CONFIG.COLORS.HANDLE;
        c.fillRect(drawerX + 15, drawerY + 8, 20, 3); c.fillRect(drawerX + 15, drawerY + dH + 10, 20, 3);

        const topGrad = c.createLinearGradient(x, y, x, y + deskTopH);
        topGrad.addColorStop(0, DESK_CONFIG.COLORS.TOP_GRADIENT_START); topGrad.addColorStop(1, DESK_CONFIG.COLORS.TOP_GRADIENT_END);
        c.fillStyle = topGrad;
        drawRoundedRect(c, x, y, w, deskTopH, 4); c.fill();
        
        c.fillStyle = '#94a3b8'; c.fillRect(x + 2, y + deskTopH - 2, w - 4, 2);
    });

    ctx.drawImage(sprite, p.x, p.y);
};
