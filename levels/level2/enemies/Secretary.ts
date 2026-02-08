
import { drawRoundedRect } from '../render/utils';

export const SECRETARY_CONFIG = {
    WIDTH: 140,
    HEIGHT: 240,
    VARIANTS: [
        { 
            name: 'THE SUPERVISOR', 
            palette: { 
                suitDark: '#1e293b', suitLight: '#334155', 
                shirt: '#f8fafc', 
                skirt: '#0f172a', 
                hair: '#facc15', hairShadow: '#ca8a04',
                skin: '#fef3c7', skinShadow: '#fde68a',
                lips: '#ef4444',
                acc: '#94a3b8' // Silver
            }
        }
    ]
};

// Helper to draw a filled curvy shape
const fillPath = (ctx: CanvasRenderingContext2D, color: string, pathFn: () => void) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    pathFn();
    ctx.fill();
};

export const drawSecretary = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    variantIndex: number, 
    frameTimer: number
) => {
    ctx.save();
    ctx.translate(Math.floor(x), Math.floor(y));

    // Always use the first variant (Supervisor)
    const config = SECRETARY_CONFIG.VARIANTS[0];
    const p = config.palette;
    
    // Breathing/Idle Animation
    const breath = Math.sin(frameTimer * 0.05) * 1.5; 
    const sway = Math.cos(frameTimer * 0.04) * 0.5;

    const centerX = SECRETARY_CONFIG.WIDTH / 2;
    const h = SECRETARY_CONFIG.HEIGHT;

    // --- SHADOW ---
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(centerX, h - 5, 50, 10, 0, 0, Math.PI*2);
    ctx.fill();

    // --- LEGS & FEET ---
    const ankleY = h - 30;
    const kneeY = h - 100;
    
    // Legs Gradient
    const legGrad = ctx.createLinearGradient(centerX - 20, kneeY, centerX + 20, kneeY);
    legGrad.addColorStop(0, p.skinShadow);
    legGrad.addColorStop(0.5, p.skin);
    legGrad.addColorStop(1, p.skinShadow);
    ctx.fillStyle = legGrad;

    // Left Leg
    ctx.beginPath();
    ctx.moveTo(centerX - 25, h - 130); // Hip
    ctx.quadraticCurveTo(centerX - 35, kneeY, centerX - 25, ankleY); // Outer Calf
    ctx.lineTo(centerX - 15, ankleY); // Ankle inner
    ctx.quadraticCurveTo(centerX - 5, kneeY, centerX - 10, h - 130); // Inner thigh
    ctx.fill();
    
    // Right Leg
    ctx.beginPath();
    ctx.moveTo(centerX + 10, h - 130);
    ctx.quadraticCurveTo(centerX + 5, kneeY, centerX + 15, ankleY);
    ctx.lineTo(centerX + 25, ankleY);
    ctx.quadraticCurveTo(centerX + 35, kneeY, centerX + 25, h - 130);
    ctx.fill();

    // --- REFINED SHOES (Pumps) ---
    const drawNiceShoe = (lx: number, ly: number, dir: number) => {
        ctx.fillStyle = '#171717'; // Main Shoe Black
        ctx.beginPath();
        ctx.moveTo(lx - (2 * dir), ly); // Back Ankle
        
        // Heel Back
        ctx.bezierCurveTo(lx - (10 * dir), ly + 5, lx - (12 * dir), ly + 15, lx - (10 * dir), ly + 25);
        
        // Stiletto Heel
        ctx.lineTo(lx - (8 * dir), ly + 35); // Heel Tip Back
        ctx.lineTo(lx - (4 * dir), ly + 35); // Heel Tip Front
        ctx.lineTo(lx - (2 * dir), ly + 25); // Heel Arch top
        
        // Sole & Toe
        ctx.quadraticCurveTo(lx + (5 * dir), ly + 32, lx + (15 * dir), ly + 30); // Sole to Toe
        ctx.quadraticCurveTo(lx + (18 * dir), ly + 25, lx + (15 * dir), ly + 20); // Toe Tip
        
        // Instep / Throat
        ctx.quadraticCurveTo(lx + (8 * dir), ly + 20, lx + (4 * dir), ly + 10); // Scoop
        ctx.lineTo(lx + (4 * dir), ly); // Front Ankle
        ctx.fill();

        // Highlight (Patent Leather Shine)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.ellipse(lx + (8 * dir), ly + 24, 4, 2, dir * 0.2, 0, Math.PI * 2);
        ctx.fill();
    };

    drawNiceShoe(centerX - 20, ankleY, -1);
    drawNiceShoe(centerX + 20, ankleY, 1);


    // --- SKIRT (Pencil Skirt) ---
    const waistY = h - 150 + breath;
    const hipY = h - 130 + breath;
    
    // Skirt Shape
    ctx.fillStyle = p.skirt;
    ctx.beginPath();
    ctx.moveTo(centerX - 25, waistY); // Waist L
    ctx.bezierCurveTo(centerX - 45, hipY, centerX - 35, h - 70, centerX - 30, h - 60); // Hip/Hem L
    ctx.lineTo(centerX + 30, h - 60); // Hem R
    ctx.bezierCurveTo(centerX + 35, h - 70, centerX + 45, hipY, centerX + 25, waistY); // Hip R
    ctx.fill();
    
    // Skirt Shadow/Fold
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.moveTo(centerX + 25, waistY + 10);
    ctx.quadraticCurveTo(centerX + 35, hipY, centerX + 28, h - 65);
    ctx.lineTo(centerX + 30, h - 60);
    ctx.bezierCurveTo(centerX + 45, hipY, centerX + 35, waistY, centerX + 25, waistY);
    ctx.fill();


    // --- TORSO (Blazer) ---
    const shoulderY = waistY - 60;
    const neckY = shoulderY - 10;
    
    // Shirt (Underneath)
    ctx.fillStyle = p.shirt;
    ctx.beginPath();
    ctx.moveTo(centerX, waistY);
    ctx.lineTo(centerX - 15, shoulderY);
    ctx.lineTo(centerX + 15, shoulderY);
    ctx.fill();

    // Blazer Body
    ctx.fillStyle = p.suitDark;
    ctx.beginPath();
    ctx.moveTo(centerX - 25, waistY);
    ctx.bezierCurveTo(centerX - 30, waistY - 20, centerX - 45, shoulderY + 20, centerX - 50, shoulderY); // Left side
    ctx.lineTo(centerX - 20, shoulderY - 10); // Left Shoulder slope
    ctx.lineTo(centerX + 20, shoulderY - 10); // Right Shoulder slope
    ctx.lineTo(centerX + 50, shoulderY); // Right side
    ctx.bezierCurveTo(centerX + 45, shoulderY + 20, centerX + 30, waistY - 20, centerX + 25, waistY);
    ctx.fill();

    // Lapels (Lighter tone)
    ctx.fillStyle = p.suitLight;
    ctx.beginPath();
    // Left Lapel
    ctx.moveTo(centerX, waistY - 10); // Button point
    ctx.lineTo(centerX - 20, shoulderY);
    ctx.lineTo(centerX - 15, shoulderY - 10); // Collar
    ctx.lineTo(centerX - 8, shoulderY + 5);
    ctx.fill();
    // Right Lapel
    ctx.beginPath();
    ctx.moveTo(centerX, waistY - 10);
    ctx.lineTo(centerX + 20, shoulderY);
    ctx.lineTo(centerX + 15, shoulderY - 10);
    ctx.lineTo(centerX + 8, shoulderY + 5);
    ctx.fill();

    // Buttons
    ctx.fillStyle = p.acc;
    ctx.beginPath(); ctx.arc(centerX, waistY - 20, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(centerX, waistY - 35, 3, 0, Math.PI*2); ctx.fill();

    // --- NECK & HEAD ---
    // Neck
    ctx.fillStyle = p.skinShadow;
    ctx.fillRect(centerX - 8, neckY, 16, 20);

    const headY = neckY - 35 + sway;
    
    // Face Shape (Jawline)
    const faceW = 44;
    
    // Hair Back (Behind head)
    ctx.fillStyle = p.hairShadow;
    // Bun
    ctx.beginPath();
    ctx.arc(centerX, headY - 10, 28, 0, Math.PI*2); // Big bun halo
    ctx.fill();

    // Face Base
    const faceGrad = ctx.createRadialGradient(centerX - 10, headY - 10, 5, centerX, headY, 30);
    faceGrad.addColorStop(0, p.skin);
    faceGrad.addColorStop(1, p.skinShadow);
    ctx.fillStyle = faceGrad;
    
    ctx.beginPath();
    ctx.moveTo(centerX - faceW/2, headY - 10);
    ctx.lineTo(centerX + faceW/2, headY - 10); // Forehead line
    ctx.bezierCurveTo(centerX + faceW/2, headY + 20, centerX + 15, headY + 30, centerX, headY + 35); // Jaw R
    ctx.bezierCurveTo(centerX - 15, headY + 30, centerX - faceW/2, headY + 20, centerX - faceW/2, headY - 10); // Jaw L
    ctx.fill();

    // Features
    // Eyes
    ctx.fillStyle = '#ffffff';
    // Left Eye
    ctx.beginPath(); ctx.ellipse(centerX - 10, headY, 6, 3, 0.1, 0, Math.PI*2); ctx.fill();
    // Right Eye
    ctx.beginPath(); ctx.ellipse(centerX + 10, headY, 6, 3, -0.1, 0, Math.PI*2); ctx.fill();
    
    // Pupils/Iris
    ctx.fillStyle = config.palette.suitDark; // Dark eyes
    ctx.beginPath(); ctx.arc(centerX - 10, headY, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(centerX + 10, headY, 2.5, 0, Math.PI*2); ctx.fill();

    // Glasses (Supervisor Only)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centerX - 20, headY - 3);
    ctx.lineTo(centerX - 4, headY - 3);
    ctx.moveTo(centerX + 4, headY - 3);
    ctx.lineTo(centerX + 20, headY - 3);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; // Lenses
    ctx.beginPath(); ctx.rect(centerX - 18, headY - 3, 14, 8); ctx.fill();
    ctx.beginPath(); ctx.rect(centerX + 4, headY - 3, 14, 8); ctx.fill();

    // Eyebrows (Angry)
    ctx.strokeStyle = p.hair;
    ctx.lineWidth = 2;
    ctx.beginPath(); 
    ctx.moveTo(centerX - 18, headY - 8); ctx.lineTo(centerX - 6, headY - 5); ctx.stroke();
    ctx.beginPath(); 
    ctx.moveTo(centerX + 18, headY - 8); ctx.lineTo(centerX + 6, headY - 5); ctx.stroke();

    // Nose
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath(); ctx.moveTo(centerX, headY + 5); ctx.lineTo(centerX - 3, headY + 12); ctx.lineTo(centerX + 3, headY + 12); ctx.fill();

    // Mouth
    ctx.fillStyle = p.lips;
    ctx.beginPath();
    ctx.moveTo(centerX - 8, headY + 20);
    ctx.quadraticCurveTo(centerX, headY + 23, centerX + 8, headY + 20); // Upper lip
    ctx.quadraticCurveTo(centerX, headY + 26, centerX - 8, headY + 20); // Lower lip
    ctx.fill();

    // Hair Front (Strict side bangs)
    ctx.fillStyle = p.hair;
    ctx.beginPath();
    ctx.ellipse(centerX, headY - 28, 25, 10, 0, 0, Math.PI*2); // Top volume
    ctx.fill();
    // Bangs
    ctx.beginPath();
    ctx.moveTo(centerX, headY - 28);
    ctx.quadraticCurveTo(centerX + 22, headY - 20, centerX + 22, headY - 5);
    ctx.quadraticCurveTo(centerX - 22, headY - 20, centerX - 22, headY - 5);
    ctx.lineTo(centerX - 22, headY - 15);
    ctx.lineTo(centerX, headY - 38);
    ctx.fill();


    // --- ARMS & PROPS (SUPERVISOR STYLE) ---
    
    const shoulderOffset = 38; 
    const shoulderYPos = shoulderY + 8;
    
    // --- RIGHT ARM (Holding Stick - Raised) ---
    ctx.fillStyle = p.suitLight;
    
    // Shoulder Cap
    ctx.beginPath(); ctx.arc(centerX + shoulderOffset, shoulderYPos, 11, 0, Math.PI*2); ctx.fill();

    // Right Arm (Bent UP)
    // Coords relative to center
    const rShoulderX = centerX + shoulderOffset;
    const rShoulderY = shoulderYPos;
    const rElbowX = rShoulderX + 25;
    const rElbowY = rShoulderY + 35;
    const rWristX = rElbowX + 25;
    const rWristY = rElbowY - 30; // Raised hand

    ctx.beginPath();
    ctx.moveTo(rShoulderX, rShoulderY - 8); // Top shoulder
    // Outer curve (Top of arm)
    ctx.quadraticCurveTo(rElbowX, rElbowY - 10, rWristX, rWristY);
    // Wrist
    ctx.lineTo(rWristX + 8, rWristY + 8);
    // Inner curve (Bottom/Inside of arm)
    ctx.quadraticCurveTo(rElbowX + 5, rElbowY + 10, rShoulderX, rShoulderY + 25);
    ctx.fill();

    // Hand
    ctx.fillStyle = p.skin;
    ctx.beginPath(); ctx.arc(rWristX + 4, rWristY + 4, 8, 0, Math.PI*2); ctx.fill();
    
    // Stick
    ctx.save();
    ctx.translate(rWristX + 4, rWristY + 4);
    ctx.rotate(-0.8); // Angle of stick
    ctx.fillStyle = '#475569'; // Stick color
    ctx.fillRect(-2, -60, 4, 120);
    ctx.fillStyle = '#ef4444'; // Tip
    ctx.fillRect(-3, -60, 6, 10);
    ctx.restore();


    // --- LEFT ARM (Holding Tablet - Bent Forward) ---
    ctx.fillStyle = p.suitLight;
    
    // Shoulder Cap
    ctx.beginPath(); ctx.arc(centerX - shoulderOffset, shoulderYPos, 11, 0, Math.PI*2); ctx.fill();

    // Left Arm Path (L-shape)
    const lShoulderX = centerX - shoulderOffset;
    const lShoulderY = shoulderYPos;
    const lElbowX = lShoulderX - 20; // Elbow sticks out left slightly
    const lElbowY = lShoulderY + 45; // Down
    const lWristX = lElbowX + 40;    // Forward towards body
    const lWristY = lElbowY - 15;    // Slightly up

    ctx.beginPath();
    ctx.moveTo(lShoulderX - 5, lShoulderY - 5);
    // Outer Elbow
    ctx.quadraticCurveTo(lElbowX - 10, lElbowY + 5, lWristX, lWristY + 10);
    // Wrist thickness
    ctx.lineTo(lWristX, lWristY - 5);
    // Inner Elbow (Crease)
    ctx.quadraticCurveTo(lElbowX + 10, lElbowY - 10, lShoulderX + 10, lShoulderY + 20);
    ctx.fill();

    // Hand
    ctx.fillStyle = p.skin;
    ctx.beginPath(); ctx.arc(lWristX, lWristY, 8, 0, Math.PI*2); ctx.fill();
    
    // Tablet
    ctx.save();
    ctx.translate(lWristX, lWristY);
    ctx.rotate(-0.2);
    ctx.fillStyle = '#1e293b';
    drawRoundedRect(ctx, -15, -25, 40, 50, 2); ctx.fill(); // Tablet Body
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-10, -20, 30, 40); // Screen
    ctx.restore();

    ctx.restore();
};
