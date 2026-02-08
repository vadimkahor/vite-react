import { Platform } from '../types';
import { getSprite, drawRoundedRect } from './utils';

export const ELECTRIC_BOX_CONFIG = {
  WIDTH: 60,
  HEIGHT: 60,
  COLORS: {
    ENCLOSURE: '#cbd5e1', // Slate 300
    ENCLOSURE_DARK: '#94a3b8', // Slate 400
    INTERIOR: '#f1f5f9', // Slate 100
    CONDUIT: '#0f172a', // Dark Navy
    BREAKER: '#ffffff',
    SCREEN: '#1e293b',
    WIRE_BLUE: '#3b82f6',
    WIRE_RED: '#ef4444',
    WIRE_YELLOW: '#eab308'
  }
};

export const drawElectricBox = (ctx: CanvasRenderingContext2D, p: Platform) => {
    const key = `platform_electric_box_v2_${p.width}_${p.height}`;
    const doorWidth = p.width * 0.8;
    const padding = 20;

    const sprite = getSprite(key, p.width + doorWidth + padding, p.height + 60, (c) => {
        // Conduit removed as per user request

        c.translate(30, 30); // Center the box in sprite
        const w = p.width;
        const h = p.height;

        // Shadow behind the box
        c.fillStyle = 'rgba(0,0,0,0.2)';
        drawRoundedRect(c, -2, 2, w + 4, h + 4, 2); c.fill();

        // Enclosure Body
        c.fillStyle = ELECTRIC_BOX_CONFIG.COLORS.ENCLOSURE;
        drawRoundedRect(c, 0, 0, w, h, 2); c.fill();
        c.strokeStyle = ELECTRIC_BOX_CONFIG.COLORS.ENCLOSURE_DARK;
        c.lineWidth = 2;
        c.stroke();

        // Interior Plate
        c.fillStyle = ELECTRIC_BOX_CONFIG.COLORS.INTERIOR;
        const innerP = 4;
        c.fillRect(innerP, innerP, w - innerP * 2, h - innerP * 2);

        // Internal Components (Simplified pixels)
        // Meter (Top part)
        c.fillStyle = '#e2e8f0';
        c.fillRect(innerP + 2, innerP + 2, w - innerP * 2 - 15, 12);
        c.fillStyle = ELECTRIC_BOX_CONFIG.COLORS.SCREEN;
        c.fillRect(innerP + 4, innerP + 4, 12, 6);
        c.fillStyle = '#4ade80'; // Digital green
        c.fillRect(innerP + 5, innerP + 5, 2, 2);

        // Breakers (Bottom part)
        const breakY = innerP + 18;
        for (let i = 0; i < 3; i++) {
            const bx = innerP + 2 + (i * 12);
            c.fillStyle = '#ffffff';
            c.fillRect(bx, breakY, 10, 15);
            c.fillStyle = i === 1 ? '#ef4444' : '#334155'; // One red toggle
            c.fillRect(bx + 3, breakY + 5, 4, 3);
        }

        // Wiring
        c.lineWidth = 1;
        c.strokeStyle = ELECTRIC_BOX_CONFIG.COLORS.WIRE_BLUE;
        c.beginPath(); c.moveTo(innerP + 2, breakY); c.quadraticCurveTo(innerP, innerP, w/2, innerP); c.stroke();
        c.strokeStyle = ELECTRIC_BOX_CONFIG.COLORS.WIRE_RED;
        c.beginPath(); c.moveTo(w - innerP - 5, breakY + 5); c.lineTo(w - innerP - 5, h - innerP); c.stroke();

        // Open Door (Swung right)
        c.save();
        c.translate(w, 0);
        c.fillStyle = ELECTRIC_BOX_CONFIG.COLORS.ENCLOSURE;
        drawRoundedRect(c, 0, 0, doorWidth, h, 1); c.fill();
        c.strokeStyle = ELECTRIC_BOX_CONFIG.COLORS.ENCLOSURE_DARK;
        c.stroke();
        // Door details (handle)
        c.fillStyle = '#64748b';
        c.fillRect(doorWidth - 10, h / 2 - 5, 4, 10);
        // Reflection on door
        c.strokeStyle = 'rgba(255,255,255,0.2)';
        c.beginPath(); c.moveTo(5, 5); c.lineTo(doorWidth - 5, 5); c.stroke();
        c.restore();

        // Hinges
        c.fillStyle = ELECTRIC_BOX_CONFIG.COLORS.ENCLOSURE_DARK;
        c.fillRect(w - 2, 5, 4, 8);
        c.fillRect(w - 2, h - 13, 4, 8);
    });

    // Draw sprite with offset
    ctx.drawImage(sprite, p.x - 30, p.y - 30);
};