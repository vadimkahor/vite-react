import { Platform } from '../types';
import { getSprite, drawRoundedRect } from './utils';

export const XEROX_CONFIG = {
  WIDTH: 90, // 0.75 of 120 (Desk width)
  HEIGHT: 85,
  COLORS: {
    BODY_LIGHT: '#f8fafc',
    BODY_MID: '#e2e8f0',
    BODY_DARK: '#94a3b8',
    PANEL: '#1e293b',
    SCREEN: '#06b6d4',
    SCAN_LIGHT: '#22d3ee'
  }
};

export const drawXerox = (ctx: CanvasRenderingContext2D, p: Platform, gameTime: number = 0) => {
    const key = `platform_xerox_${p.width}_${p.height}`;
    const bottomMargin = 10;
    
    // 1. Draw static parts via sprite
    const sprite = getSprite(key, p.width, p.height + bottomMargin, (c) => {
        const w = p.width;
        const h = p.height;
        
        // Shadow
        c.fillStyle = 'rgba(0,0,0,0.15)';
        c.beginPath(); c.ellipse(w/2, h, w/2, 4, 0, 0, Math.PI*2); c.fill();

        // Main Vertical Body
        const mainW = w * 0.7;
        const mainX = (w - mainW) / 2;
        const bodyGrad = c.createLinearGradient(mainX, 0, mainX + mainW, 0);
        bodyGrad.addColorStop(0, XEROX_CONFIG.COLORS.BODY_MID);
        bodyGrad.addColorStop(0.2, XEROX_CONFIG.COLORS.BODY_LIGHT);
        bodyGrad.addColorStop(1, XEROX_CONFIG.COLORS.BODY_DARK);
        
        c.fillStyle = bodyGrad;
        drawRoundedRect(c, mainX, 15, mainW, h - 15, 4); c.fill();
        
        // Drawers/Lines on body
        c.strokeStyle = 'rgba(0,0,0,0.1)';
        c.lineWidth = 1;
        for(let i=0; i<3; i++) {
            const ly = 35 + i * 15;
            c.beginPath(); c.moveTo(mainX + 4, ly); c.lineTo(mainX + mainW - 4, ly); c.stroke();
            // Small handle dots
            c.fillStyle = XEROX_CONFIG.COLORS.BODY_DARK;
            c.fillRect(mainX + mainW/2 - 5, ly + 4, 10, 2);
        }

        // Left Side Tray (Paper input)
        c.fillStyle = XEROX_CONFIG.COLORS.BODY_MID;
        drawRoundedRect(c, mainX - 15, 25, 15, 30, 2); c.fill();
        c.fillStyle = XEROX_CONFIG.COLORS.BODY_DARK;
        c.fillRect(mainX - 12, 30, 10, 2);
        c.fillRect(mainX - 12, 38, 10, 2);

        // Right Side Output Tray
        c.fillStyle = XEROX_CONFIG.COLORS.BODY_MID;
        drawRoundedRect(c, mainX + mainW, 50, 20, 15, 2); c.fill();
        
        // Top Scanner Unit
        const scannerH = 20;
        const scannerY = 0;
        c.fillStyle = bodyGrad;
        drawRoundedRect(c, mainX - 5, scannerY, mainW + 10, scannerH, 3); c.fill();
        
        // Scanner Lid Gap
        c.fillStyle = 'rgba(0,0,0,0.2)';
        c.fillRect(mainX - 5, scannerY + 12, mainW + 10, 2);

        // Control Panel
        c.fillStyle = XEROX_CONFIG.COLORS.PANEL;
        drawRoundedRect(c, mainX + 5, scannerY + 2, 30, 10, 2); c.fill();
        c.fillStyle = XEROX_CONFIG.COLORS.SCREEN;
        c.fillRect(mainX + 8, scannerY + 4, 12, 6);
        
        // Wheels
        c.fillStyle = '#334155';
        c.fillRect(mainX + 5, h - 4, 6, 4);
        c.fillRect(mainX + mainW - 11, h - 4, 6, 4);
    });

    ctx.drawImage(sprite, p.x, p.y);

    // 2. Animated Scanning Light
    ctx.save();
    ctx.translate(p.x, p.y);
    const mainW = p.width * 0.7;
    const mainX = (p.width - mainW) / 2;
    
    // Scanner light moves left and right
    const scanProgress = (Math.sin(gameTime * 0.05) + 1) / 2;
    const lightX = mainX - 2 + (scanProgress * (mainW + 4));
    
    // The light strip
    const grad = ctx.createLinearGradient(lightX - 5, 0, lightX + 5, 0);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.5, XEROX_CONFIG.COLORS.SCAN_LIGHT);
    grad.addColorStop(1, 'transparent');
    
    ctx.fillStyle = grad;
    ctx.globalCompositeOperation = 'screen';
    ctx.fillRect(lightX - 10, 12, 20, 2);
    
    // Small glow dot
    ctx.shadowBlur = 8;
    ctx.shadowColor = XEROX_CONFIG.COLORS.SCAN_LIGHT;
    ctx.fillStyle = 'white';
    ctx.fillRect(lightX - 2, 11, 4, 4);
    
    ctx.restore();
};
