
import { Platform } from '../types';
import { getSprite, drawRoundedRect, getGlowSprite } from './utils';

export const VENDING_CONFIG = {
  WIDTH: 120,
  HEIGHT: 160, // Same as FileCabinet for consistency in Tier 2
  COLORS: {
    BODY_DARK: '#0f172a',
    BODY_MID: '#1e293b',
    COFFEE_PANEL: '#27272a',
    GLASS: 'rgba(186, 230, 253, 0.2)',
    NEON_TOP_BLUE: '#3b82f6', // Replaced pink with blue
    NEON_BLUE: '#1e40af',     // Darker, more saturated blue for the sign
    NEON_CYAN: '#22d3ee',
    NEON_AMBER: '#fbbf24',
    SIGN_SUPPORT: '#1e293b'   // More subtle color for supports
  }
};

export const drawVending = (ctx: CanvasRenderingContext2D, p: Platform, gameTime: number = 0) => {
    const key = `platform_vending_v5_${p.width}_${p.height}`;
    const bottomMargin = 10;
    const topMargin = 90; // Reduced margin as sign is lower

    // 1. Static body parts via sprite
    const sprite = getSprite(key, p.width + 80, p.height + bottomMargin + topMargin, (c) => {
        // Center the machine within the sprite horizontally to allow sign overflow
        c.translate(40, topMargin);
        const w = p.width;
        const h = p.height;
        const coffeePartW = w * 0.45;
        const snackPartW = w * 0.55;

        // Shadow
        c.fillStyle = 'rgba(0,0,0,0.2)';
        c.beginPath(); c.ellipse(w / 2, h, w / 2, 5, 0, 0, Math.PI * 2); c.fill();

        // Sign Supports (rods) - Thinner and lower
        c.fillStyle = VENDING_CONFIG.COLORS.SIGN_SUPPORT;
        c.fillRect(22, -50, 3, 50); 
        c.fillRect(w - 25, -50, 3, 50);

        // --- LEFT PART (COFFEE/DRINKS) ---
        c.fillStyle = VENDING_CONFIG.COLORS.BODY_DARK;
        drawRoundedRect(c, 0, 0, coffeePartW - 2, h, 4); c.fill();

        // Top Brand Area
        c.fillStyle = '#18181b';
        c.fillRect(4, 8, coffeePartW - 10, 35);
        // Cup drawing
        c.fillStyle = VENDING_CONFIG.COLORS.NEON_AMBER;
        c.fillRect(coffeePartW / 2 - 5, 20, 10, 12); // placeholder cup
        c.fillStyle = 'white';
        c.fillRect(coffeePartW / 2 - 3, 18, 6, 2); // steam

        // Selection Panel
        c.fillStyle = VENDING_CONFIG.COLORS.COFFEE_PANEL;
        drawRoundedRect(c, 6, 50, coffeePartW - 14, 60, 2); c.fill();
        // Buttons (dots)
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 2; col++) {
                c.fillStyle = '#3f3f46';
                c.beginPath(); c.arc(12 + col * 18, 58 + row * 9, 2.5, 0, Math.PI * 2); c.fill();
            }
        }

        // Dispensing Area
        c.fillStyle = '#09090b';
        drawRoundedRect(c, 8, 115, coffeePartW - 18, 30, 2); c.fill();

        // --- RIGHT PART (SNACKS) ---
        c.fillStyle = VENDING_CONFIG.COLORS.BODY_MID;
        drawRoundedRect(c, coffeePartW, 0, snackPartW, h, 4); c.fill();

        // Inner light area (background for snacks)
        c.fillStyle = '#020617';
        drawRoundedRect(c, coffeePartW + 6, 10, snackPartW - 12, h - 45, 2); c.fill();

        // Shelves and Snacks
        const rowH = (h - 65) / 5;
        for (let r = 0; r < 5; r++) {
            const ry = 15 + r * rowH;
            // Shelf
            c.fillStyle = '#334155';
            c.fillRect(coffeePartW + 8, ry + rowH - 2, snackPartW - 16, 2);

            // Random items
            for (let i = 0; i < 4; i++) {
                const rx = coffeePartW + 10 + i * (snackPartW / 4.5);
                const itemW = 8;
                const itemH = 12;
                const colors = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#d946ef'];
                c.fillStyle = colors[(r + i) % colors.length];
                c.fillRect(rx, ry + rowH - itemH - 2, itemW, itemH);
            }
        }

        // Glass
        c.fillStyle = VENDING_CONFIG.COLORS.GLASS;
        drawRoundedRect(c, coffeePartW + 6, 10, snackPartW - 12, h - 45, 2); c.fill();
        // Reflection
        c.strokeStyle = 'rgba(255,255,255,0.1)';
        c.beginPath(); c.moveTo(coffeePartW + 10, 15); c.lineTo(coffeePartW + 30, 15); c.lineTo(coffeePartW + 10, 35); c.stroke();

        // Bottom Tray
        c.fillStyle = '#09090b';
        drawRoundedRect(c, coffeePartW + 6, h - 30, snackPartW - 12, 20, 2); c.fill();
        
        // Feet
        c.fillStyle = 'black';
        c.fillRect(5, h - 4, 10, 4);
        c.fillRect(w - 15, h - 4, 10, 4);
    });

    // Draw sprite with negative y offset and x offset to account for sign overflow
    ctx.drawImage(sprite, p.x - 40, p.y - topMargin);

    // 2. Animated / Neon Effects (OPTIMIZED: Using Sprites)
    ctx.save();
    ctx.translate(p.x, p.y);

    const flicker = Math.sin(gameTime * 0.1) * 0.2 + 0.8;
    const heavyFlicker = Math.random() > 0.98 ? 0.3 : 1.0;
    const coffeePartW = p.width * 0.45;

    // Pre-calculate/fetch glow sprites
    const blueSignGlow = getGlowSprite(VENDING_CONFIG.COLORS.NEON_BLUE, 256);
    const cyanGlow = getGlowSprite(VENDING_CONFIG.COLORS.NEON_CYAN, 64);
    const topBlueGlow = getGlowSprite(VENDING_CONFIG.COLORS.NEON_TOP_BLUE, 128);
    const amberGlow = getGlowSprite(VENDING_CONFIG.COLORS.NEON_AMBER, 32);

    // --- NEON SIGN "COFFEE" (Size reduced by 20%: 48px -> 38px) ---
    const signY = -40; // Lowered sign
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    
    // Sign Glow Sprite
    ctx.globalAlpha = 0.8 * flicker * heavyFlicker;
    ctx.drawImage(blueSignGlow, p.width/2 - 128, signY - 128, 256, 256);
    ctx.globalAlpha = 1.0;

    // Background plate for the sign (Resized for 38px font)
    const plateW = p.width + 80;
    const plateH = 65;
    ctx.globalCompositeOperation = 'source-over'; // Switch back for plate
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    drawRoundedRect(ctx, (p.width - plateW) / 2, signY - plateH/2, plateW, plateH, 8); ctx.fill();
    
    // Neon text (38px Orbitron)
    ctx.fillStyle = VENDING_CONFIG.COLORS.NEON_BLUE;
    ctx.font = 'bold 38px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('COFFEE', p.width / 2, signY);
    
    // Inner bright tube core
    ctx.fillStyle = '#dbeafe';
    ctx.fillText('COFFEE', p.width / 2, signY);
    ctx.restore();

    // Glowing Screen on coffee side
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = flicker;
    ctx.drawImage(cyanGlow, 8 - 29, 55 - 30, 64, 64);
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = VENDING_CONFIG.COLORS.NEON_CYAN;
    ctx.fillRect(8, 55, 6, 4); // Status LED
    ctx.restore();
    
    // Neon Strip at the top of the machine (Blue)
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.7 * flicker;
    // Stretch the glow sprite across the top
    ctx.drawImage(topBlueGlow, 0, 5 - 64, p.width, 128);
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = VENDING_CONFIG.COLORS.NEON_TOP_BLUE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, 5); ctx.lineTo(p.width - 4, 5);
    ctx.stroke();
    ctx.restore();

    // Internal glow for snacks (Standard fill rect with low alpha is faster than shadowBlur)
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(coffeePartW + 6, 10, p.width * 0.55 - 12, p.height - 45);

    // Glowing selection buttons
    const btnTime = Math.floor(gameTime * 0.05) % 12;
    const btnRow = Math.floor(btnTime / 2);
    const btnCol = btnTime % 2;
    
    // Draw glow sprite for active button
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(amberGlow, (12 + btnCol * 18) - 16, (58 + btnRow * 9) - 16, 32, 32);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = VENDING_CONFIG.COLORS.NEON_AMBER;
    ctx.beginPath(); 
    ctx.arc(12 + btnCol * 18, 58 + btnRow * 9, 1.5, 0, Math.PI * 2); 
    ctx.fill();
    ctx.restore();

    ctx.restore();
};
