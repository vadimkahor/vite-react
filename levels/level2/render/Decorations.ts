
import { Decoration } from '../types';
import { getSprite, drawRoundedRect } from './utils';

interface DecorationSpec {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

export const DECORATION_SPECS: Record<Decoration['type'], DecorationSpec> = {
  computer: { width: 40, height: 50, offsetX: 0, offsetY: 40 },
  plant: { width: 40, height: 50, offsetX: 10, offsetY: 40 },
  papers: { width: 100, height: 110, offsetX: 30, offsetY: 100 }, 
  cooler: { width: 60, height: 170, offsetX: 0, offsetY: 160 },
  // Increased sizes for bigger models
  boxes: { width: 100, height: 144, offsetX: 10, offsetY: 140 }, 
  tv: { width: 120, height: 160, offsetX: 0, offsetY: 155 },
  floor_plant: { width: 80, height: 160, offsetX: 20, offsetY: 160 },
  phone: { width: 30, height: 20, offsetX: 0, offsetY: 15 },
  coffee: { width: 25, height: 35, offsetX: 0, offsetY: 30 }, 
  trashcan: { width: 40, height: 55, offsetX: 0, offsetY: 50 },
  clock: { width: 40, height: 40, offsetX: 0, offsetY: 0 },
  floor_lamp: { width: 60, height: 170, offsetX: 10, offsetY: 170 },
  desk_lamp: { width: 40, height: 50, offsetX: 5, offsetY: 50 },
  window: { width: 0, height: 0, offsetX: 0, offsetY: 0 } 
};

export const drawDecoration = (ctx: CanvasRenderingContext2D, d: Decoration) => {
    const key = `deco_${d.type}_${d.variant}`;
    const spec = DECORATION_SPECS[d.type];
    if (!spec) return;

    const w = spec.width;
    const h = spec.height;
    const offsetX = spec.offsetX;
    const offsetY = spec.offsetY;

    const sprite = getSprite(key, w, h, (c) => {
        const dx = offsetX; 
        const dy = offsetY;
        
        // --- Shadows for Floor Objects ---
        const isFloorObject = d.type === 'cooler' || d.type === 'boxes' || d.type === 'floor_plant' || d.type === 'tv' || d.type === 'trashcan';
        if (isFloorObject) {
            c.fillStyle = 'rgba(0,0,0,0.1)'; 
            // Center shadow
            c.beginPath(); 
            c.ellipse(w / 2, dy, d.type === 'tv' ? 50 : 25, 6, 0, 0, Math.PI*2); 
            c.fill();
        }

        // --- Drawing Logic per Type ---
        if (d.type === 'clock') {
            const cx = w / 2;
            const cy = h / 2;
            const r = 16;
            
            c.fillStyle = '#1e293b'; c.beginPath(); c.arc(cx, cy, r + 2, 0, Math.PI*2); c.fill();
            c.fillStyle = 'white'; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI*2); c.fill();
            c.strokeStyle = '#94a3b8'; c.lineWidth = 1;
            for(let i=0; i<12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                c.beginPath(); c.moveTo(cx + Math.cos(angle)*(r-2), cy + Math.sin(angle)*(r-2)); c.lineTo(cx + Math.cos(angle)*r, cy + Math.sin(angle)*r); c.stroke();
            }
            const hourAngle = (d.variant * 30 - 90) * Math.PI / 180;
            const minAngle = -90 * Math.PI / 180;
            c.strokeStyle = '#0f172a'; c.lineCap = 'round';
            c.lineWidth = 2.5; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(hourAngle)*8, cy + Math.sin(hourAngle)*8); c.stroke();
            c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(minAngle)*12, cy + Math.sin(minAngle)*12); c.stroke();
            c.fillStyle = '#ef4444'; c.beginPath(); c.arc(cx, cy, 1.5, 0, Math.PI*2); c.fill();

        } else if (d.type === 'floor_lamp') {
            const cx = w / 2;
            c.fillStyle = 'rgba(0,0,0,0.15)'; c.beginPath(); c.ellipse(cx, dy, 17, 4, 0, 0, Math.PI*2); c.fill();
            c.fillStyle = '#0f172a'; c.beginPath(); c.ellipse(cx, dy - 2, 15, 3, 0, 0, Math.PI*2); c.fill();
            c.fillStyle = '#1e293b'; c.fillRect(cx - 2, dy - 140, 4, 135);
            c.beginPath(); c.moveTo(cx, dy - 138); c.lineTo(cx + 15, dy - 150); 
            c.strokeStyle = '#0f172a'; c.lineWidth = 3; c.stroke();
            c.save(); c.translate(cx + 15, dy - 150); c.rotate(Math.PI / 4);
            const lightL = 80; const lightW = 50;
            const lightGrad = c.createLinearGradient(0, 0, 0, lightL);
            lightGrad.addColorStop(0, 'rgba(255, 255, 200, 0.4)'); lightGrad.addColorStop(1, 'rgba(255, 255, 200, 0)');
            c.fillStyle = lightGrad; c.beginPath(); c.moveTo(-10, 5); c.lineTo(-lightW/2, lightL); c.lineTo(lightW/2, lightL); c.lineTo(10, 5); c.fill();
            c.fillStyle = '#0f172a'; c.beginPath(); c.moveTo(-8, -10); c.lineTo(8, -10); c.lineTo(12, 12); c.lineTo(-12, 12); c.fill();
            c.restore();

        } else if (d.type === 'desk_lamp') {
            const cx = w / 2;
            c.fillStyle = '#0f172a'; c.beginPath(); c.ellipse(cx, dy, 8, 2, 0, 0, Math.PI*2); c.fill();
            c.strokeStyle = '#1e293b'; c.lineWidth = 2.5; c.lineCap = 'round';
            c.beginPath(); c.moveTo(cx, dy - 2); c.lineTo(cx + 8, dy - 15); c.stroke();
            c.beginPath(); c.moveTo(cx + 8, dy - 15); c.lineTo(cx - 5, dy - 35); c.stroke();
            c.save(); c.translate(cx - 5, dy - 35); c.rotate(-Math.PI / 6);
            c.fillStyle = 'rgba(255, 255, 220, 0.3)'; c.beginPath(); c.moveTo(-6, 4); c.lineTo(-15, 40); c.quadraticCurveTo(0, 45, 15, 40); c.lineTo(6, 4); c.fill();
            c.fillStyle = '#0f172a'; c.beginPath(); c.moveTo(-4, -6); c.lineTo(4, -6); c.lineTo(7, 6); c.lineTo(-7, 6); c.fill();
            c.restore();

        } else if (d.type === 'trashcan') {
            const cx = w/2;
            const cy = dy;
            const isSilver = d.variant === 3;
            
            if (isSilver) {
                // SILVER / CHROME STYLE
                // Body
                const grad = c.createLinearGradient(cx - 14, 0, cx + 14, 0);
                grad.addColorStop(0, '#94a3b8'); grad.addColorStop(0.3, '#e2e8f0'); grad.addColorStop(0.5, '#f8fafc'); grad.addColorStop(0.8, '#cbd5e1'); grad.addColorStop(1, '#64748b');
                c.fillStyle = grad;
                
                c.beginPath();
                c.moveTo(cx - 12, cy); 
                c.lineTo(cx - 14, cy - 45);
                c.lineTo(cx + 14, cy - 45);
                c.lineTo(cx + 12, cy);
                c.fill();

                // Rim
                c.fillStyle = '#e2e8f0';
                c.beginPath(); c.ellipse(cx, cy - 45, 14, 4, 0, 0, Math.PI*2); c.fill();
                // Hole
                c.fillStyle = '#1e293b';
                c.beginPath(); c.ellipse(cx, cy - 45, 12, 3, 0, 0, Math.PI*2); c.fill();
            } else {
                // BLACK MESH STYLE
                c.fillStyle = '#1e293b';
                c.beginPath();
                c.moveTo(cx - 10, cy); 
                c.lineTo(cx - 14, cy - 45);
                c.lineTo(cx + 14, cy - 45);
                c.lineTo(cx + 10, cy);
                c.fill();
                
                // Mesh details (Horizontal ribs)
                c.fillStyle = 'rgba(255,255,255,0.08)';
                for(let i=0; i<5; i++) {
                    c.fillRect(cx - 12, cy - 40 + (i*8), 24, 2);
                }
                
                // Rim
                c.fillStyle = '#334155';
                c.beginPath(); c.ellipse(cx, cy - 45, 14, 4, 0, 0, Math.PI*2); c.fill();
                c.fillStyle = '#0f172a';
                c.beginPath(); c.ellipse(cx, cy - 45, 11, 3, 0, 0, Math.PI*2); c.fill();
            }

        } else if (d.type === 'boxes') {
            const drawBox = (bx: number, by: number, bw: number, bh: number) => {
                c.fillStyle = '#d4a373'; // Cardboard
                c.fillRect(bx, by-bh, bw, bh);
                // Tape
                c.fillStyle = '#e9c46a'; 
                c.fillRect(bx + bw/2 - 2, by-bh, 4, bh);
                c.strokeStyle = '#a16207';
                c.lineWidth = 1;
                c.strokeRect(bx, by-bh, bw, bh);
            };
            
            // HIGH PILE (Pyramid style)
            // Base
            drawBox(dx, dy, 40, 35);
            drawBox(dx + 42, dy, 38, 32);
            // Mid
            drawBox(dx + 8, dy - 35, 35, 30);
            drawBox(dx + 45, dy - 32, 32, 28);
            // Top
            drawBox(dx + 25, dy - 65, 30, 25);

        } else if (d.type === 'tv') {
            const cx = w/2;
            
            // WHITE STAND
            c.fillStyle = '#f1f5f9'; // White/Slate-100
            drawRoundedRect(c, cx - 40, dy - 60, 80, 60, 4); c.fill();
            // Shadow under top overhang
            c.fillStyle = 'rgba(0,0,0,0.1)';
            c.fillRect(cx - 40, dy - 60, 80, 4);
            
            // Handles (Silver)
            c.fillStyle = '#cbd5e1';
            c.fillRect(cx - 25, dy - 45, 15, 3);
            c.fillRect(cx + 10, dy - 45, 15, 3);
            
            // Doors separator
            c.fillStyle = '#e2e8f0';
            c.fillRect(cx - 1, dy - 55, 2, 50);

            // TV
            const tvW = 100; const tvH = 65; const tvY = dy - 60 - tvH;
            
            // Bezel
            c.fillStyle = '#0f172a';
            drawRoundedRect(c, cx - tvW/2, tvY, tvW, tvH, 4); c.fill();
            
            // Screen
            const screenGrad = c.createLinearGradient(cx, tvY, cx, tvY + tvH);
            screenGrad.addColorStop(0, '#334155'); screenGrad.addColorStop(1, '#000000');
            c.fillStyle = screenGrad;
            c.fillRect(cx - tvW/2 + 4, tvY + 4, tvW - 8, tvH - 12);
            
            // RED LIGHT (Power LED)
            c.shadowColor = '#ef4444'; c.shadowBlur = 6;
            c.fillStyle = '#ef4444';
            c.fillRect(cx + tvW/2 - 12, tvY + tvH - 6, 6, 2);
            c.shadowBlur = 0;

            // Reflection
            c.fillStyle = 'rgba(255,255,255,0.05)';
            c.beginPath(); c.moveTo(cx - 20, tvY + 4); c.lineTo(cx + 20, tvY + 4); c.lineTo(cx - 40, tvY + 40); c.fill();

        } else if (d.type === 'plant') {
            const cx = dx + 10;
            const potY = dy - 14;
            c.fillStyle = '#fbbf24'; c.fillRect(cx - 8, potY, 16, 14);
            c.fillStyle = '#fde047'; c.fillRect(cx - 9, potY, 18, 3);
            c.fillStyle = '#16a34a'; 
            if (d.variant === 0) { // Pothos
                c.beginPath(); c.ellipse(cx, potY - 6, 6, 10, 0, 0, Math.PI*2); c.fill();
                c.beginPath(); c.ellipse(cx - 5, potY - 2, 5, 8, -0.4, 0, Math.PI*2); c.fill();
                c.beginPath(); c.ellipse(cx + 5, potY - 2, 5, 8, 0.4, 0, Math.PI*2); c.fill();
            } else if (d.variant === 1) { // Bonsai
                c.strokeStyle = '#5d4037'; c.lineWidth = 3;
                c.beginPath(); c.moveTo(cx, potY); c.quadraticCurveTo(cx - 5, potY - 10, cx - 2, potY - 20); c.stroke();
                c.fillStyle = '#15803d'; c.beginPath(); c.arc(cx - 2, potY - 20, 8, 0, Math.PI*2); c.fill();
            } else { // Cactus
                c.beginPath(); c.arc(cx, potY - 4, 7, 0, Math.PI*2); c.fill();
                c.fillStyle = '#ec4899'; c.beginPath(); c.arc(cx, potY - 11, 2, 0, Math.PI*2); c.fill();
            }

        } else if (d.type === 'floor_plant') {
            const cx = w / 2;
            const potY = dy - 24; 
            const potGrad = c.createLinearGradient(cx - 16, potY, cx + 16, potY);
            potGrad.addColorStop(0, '#334155'); potGrad.addColorStop(0.5, '#475569'); potGrad.addColorStop(1, '#1e293b');
            c.fillStyle = potGrad;
            c.beginPath(); c.moveTo(cx - 14, potY); c.lineTo(cx + 14, potY); c.lineTo(cx + 10, dy); c.lineTo(cx - 10, dy); c.fill();
            c.fillStyle = '#1e293b'; drawRoundedRect(c, cx - 16, potY, 32, 6, 2); c.fill();

            if (d.variant === 0) { // Snake Plant
                const leaves = [{x: -5, h: 70, w: 6, rot: -0.1}, {x: 5, h: 60, w: 5, rot: 0.1}, {x: 0, h: 90, w: 7, rot: 0}];
                leaves.forEach(l => {
                    c.save(); c.translate(cx + l.x, potY + 4); c.rotate(l.rot);
                    const lg = c.createLinearGradient(0, 0, 0, -l.h); lg.addColorStop(0, '#14532d'); lg.addColorStop(1, '#16a34a');
                    c.fillStyle = lg; c.strokeStyle = '#facc15'; c.lineWidth = 1;
                    c.beginPath(); c.moveTo(-l.w/2, 0); c.lineTo(0, -l.h); c.lineTo(l.w/2, 0); c.fill(); c.stroke();
                    c.restore();
                });
            } else if (d.variant === 1) { // Rubber Plant
                c.strokeStyle = '#78350f'; c.lineWidth = 3; c.lineCap = 'round';
                c.beginPath(); c.moveTo(cx, potY+5); c.quadraticCurveTo(cx+2, potY-40, cx-2, potY-90); c.stroke();
                const drawLeaf = (lx: number, ly: number, a: number) => {
                    c.save(); c.translate(lx, ly); c.rotate(a);
                    c.fillStyle = '#064e3b'; c.beginPath(); c.ellipse(10, 0, 12, 5, 0, 0, Math.PI*2); c.fill(); c.restore();
                };
                drawLeaf(cx, potY-20, -0.4); drawLeaf(cx, potY-50, -0.8); drawLeaf(cx-2, potY-80, -1.5);
            } else if (d.variant === 2) { // Dracaena
                 const stems = [ { h: 90, x: -4, w: 4, lean: -0.05 }, { h: 60, x: 6, w: 3, lean: 0.05 }, { h: 40, x: -8, w: 3, lean: -0.1 } ];
                 stems.forEach(stem => {
                     c.save(); c.translate(cx + stem.x, potY + 5); c.rotate(stem.lean);
                     c.fillStyle = '#a16207'; c.fillRect(-stem.w/2, -stem.h, stem.w, stem.h);
                     c.fillStyle = 'rgba(0,0,0,0.2)'; for(let i=0; i<stem.h; i+=8) c.fillRect(-stem.w/2, -i, stem.w, 1);
                     c.translate(0, -stem.h);
                     const leafCount = 12;
                     for(let i=0; i<leafCount; i++) {
                         c.save(); const angle = ((i / leafCount) * Math.PI) - (Math.PI/2) + (Math.random()*0.2); c.rotate(angle);
                         const lLen = 25 + Math.random() * 15; const lWid = 4;
                         const lGrad = c.createLinearGradient(0,0,0,-lLen); lGrad.addColorStop(0, '#15803d'); lGrad.addColorStop(0.5, '#4ade80'); lGrad.addColorStop(1, '#facc15'); 
                         c.fillStyle = lGrad; c.beginPath(); c.moveTo(-lWid/2, 0); c.quadraticCurveTo(0, -lLen/2, 0, -lLen); c.quadraticCurveTo(0, -lLen/2, lWid/2, 0); c.fill(); c.restore();
                     }
                     c.restore();
                 });
            } else { // Monstera
                 c.strokeStyle = '#064e3b'; c.lineWidth = 2; c.lineCap = 'round';
                 const leaves = [ { x: -15, y: -50, s: 1, r: -0.3, c: '#15803d' }, { x: 18, y: -60, s: 1.1, r: 0.2, c: '#16a34a' }, { x: 0, y: -80, s: 1.2, r: 0, c: '#166534' }, { x: -20, y: -30, s: 0.8, r: -0.6, c: '#14532d' }, { x: 15, y: -35, s: 0.8, r: 0.5, c: '#15803d' } ];
                 leaves.forEach(leaf => {
                     c.beginPath(); c.moveTo(cx, potY); c.quadraticCurveTo(cx + leaf.x/2, potY + leaf.y/2, cx + leaf.x, potY + leaf.y); c.stroke();
                     c.save(); c.translate(cx + leaf.x, potY + leaf.y); c.rotate(leaf.r); c.scale(leaf.s, leaf.s);
                     c.fillStyle = leaf.c; c.beginPath(); const sz = 12; c.moveTo(0, 5); c.bezierCurveTo(-sz, -5, -sz*1.5, -sz*1.5, 0, -sz*2); c.bezierCurveTo(sz*1.5, -sz*1.5, sz, -5, 0, 5); c.fill();
                     c.globalCompositeOperation = 'destination-out';
                     c.beginPath(); c.ellipse(-6, -10, 3, 1.5, -0.2, 0, Math.PI*2); c.fill(); c.beginPath(); c.ellipse(-5, -4, 2, 1, -0.1, 0, Math.PI*2); c.fill(); c.beginPath(); c.ellipse(6, -12, 2.5, 1.5, 0.2, 0, Math.PI*2); c.fill(); c.beginPath(); c.ellipse(5, -5, 2.5, 1, 0.1, 0, Math.PI*2); c.fill();
                     c.globalCompositeOperation = 'source-over'; c.strokeStyle = 'rgba(255,255,255,0.1)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 5); c.lineTo(0, -sz*1.5); c.stroke(); c.restore();
                 });
            }

        } else if (d.type === 'papers') {
            const drawStack = (sx: number, sy: number, cnt: number) => {
                for(let i=0; i<cnt; i++) {
                    const r = Math.sin(i * 1.5 + sx); const xOff = r * 1.5; const rot = r * 0.03;
                    c.save(); c.translate(sx + xOff, sy - i * 2.5); c.rotate(rot);
                    c.fillStyle = '#cbd5e1'; c.fillRect(-12, 0, 24, 2); c.fillStyle = '#f8fafc'; c.fillRect(-12, 0, 24, 1.5); c.restore();
                }
            };
            if (d.variant === 3) { drawStack(dx - 12, dy, 7); drawStack(dx + 12, dy, 10); drawStack(dx, dy + 3, 4); } 
            else { const counts = [5, 10, 20]; drawStack(dx, dy, counts[d.variant % 3]); }

        } else if (d.type === 'computer') {
            const monX = dx; const monY = dy - 40; 
            c.fillStyle = '#1e293b'; c.fillRect(monX + 12, monY + 28, 8, 12); c.fillRect(monX + 6, monY + 38, 20, 2); 
            c.fillStyle = '#0f172a'; drawRoundedRect(c, monX, monY, 32, 24, 2); c.fill();
            c.fillStyle = (d.variant % 3 === 0) ? '#06b6d4' : '#ef4444'; c.fillRect(monX + 2, monY + 2, 28, 20); 

        } else if (d.type === 'phone') {
            c.fillStyle = '#1e293b'; c.beginPath(); c.moveTo(dx+5, dy); c.lineTo(dx+25, dy); c.lineTo(dx+25, dy-8); c.lineTo(dx+5, dy-4); c.fill();

        } else if (d.type === 'coffee') {
            const cx = dx + 12; const cy = dy - 15;
            c.fillStyle = '#f8fafc'; drawRoundedRect(c, cx, cy, 14, 16, 3); c.fill();
            c.strokeStyle = '#f8fafc'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx + 14, cy + 4); c.quadraticCurveTo(cx + 20, cy + 8, cx + 14, cy + 12); c.stroke();
            c.fillStyle = '#451a03'; c.beginPath(); c.ellipse(cx + 7, cy + 2, 5, 2, 0, 0, Math.PI*2); c.fill();
            c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 1.5; c.lineCap = 'round';
            const drawSteamLine = (sx: number, sy: number) => { c.beginPath(); c.moveTo(sx, sy); c.bezierCurveTo(sx + 3, sy - 5, sx - 3, sy - 10, sx, sy - 15); c.stroke(); };
            drawSteamLine(cx + 4, cy - 2); drawSteamLine(cx + 10, cy - 4);

        } else if (d.type === 'cooler') {
            const cx = w / 2; const coolerW = 42; const coolerH = 70; const coolerY = dy - coolerH;
            const bodyGrad = c.createLinearGradient(cx - coolerW/2, coolerY, cx + coolerW/2, coolerY);
            bodyGrad.addColorStop(0, '#e2e8f0'); bodyGrad.addColorStop(0.5, '#f8fafc'); bodyGrad.addColorStop(1, '#cbd5e1');
            c.fillStyle = bodyGrad; drawRoundedRect(c, cx - coolerW/2, coolerY, coolerW, coolerH, 4); c.fill();
            c.fillStyle = 'rgba(0,0,0,0.05)'; c.fillRect(cx - coolerW/2, coolerY, 4, coolerH); c.fillRect(cx + coolerW/2 - 4, coolerY, 4, coolerH);
            const bottleW = 46; const bottleH = 55; const bottleY = coolerY - bottleH + 5; 
            const waterGrad = c.createLinearGradient(cx - bottleW/2, bottleY, cx + bottleW/2, bottleY);
            waterGrad.addColorStop(0, '#3b82f6'); waterGrad.addColorStop(0.5, '#60a5fa'); waterGrad.addColorStop(1, '#2563eb');
            c.fillStyle = waterGrad; c.beginPath(); c.moveTo(cx - 8, coolerY); c.lineTo(cx - 8, coolerY - 5); c.lineTo(cx - bottleW/2, coolerY - 15); c.lineTo(cx - bottleW/2, bottleY + 10); c.quadraticCurveTo(cx, bottleY - 5, cx + bottleW/2, bottleY + 10); c.lineTo(cx + bottleW/2, coolerY - 15); c.lineTo(cx + 8, coolerY - 5); c.lineTo(cx + 8, coolerY); c.fill();
            c.fillStyle = 'rgba(255,255,255,0.2)'; c.beginPath(); c.ellipse(cx + 10, bottleY + 20, 4, 8, 0.5, 0, Math.PI*2); c.fill(); c.beginPath(); c.arc(cx - 5, bottleY + 30, 3, 0, Math.PI*2); c.fill();
            const dispH = 25; const dispY = coolerY + 15;
            c.fillStyle = '#cbd5e1'; c.fillRect(cx - 16, dispY, 32, dispH); c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(cx - 16, dispY, 32, 4);
            const tapY = dispY + 5; c.fillStyle = '#ef4444'; c.fillRect(cx - 12, tapY, 8, 10); c.fillStyle = '#b91c1c'; c.fillRect(cx - 12, tapY, 2, 10); c.fillStyle = '#3b82f6'; c.fillRect(cx + 4, tapY, 8, 10); c.fillStyle = '#1d4ed8'; c.fillRect(cx + 4, tapY, 2, 10); 
            const trayY = coolerY + 50; c.fillStyle = '#334155'; for(let i=0; i<4; i++) { c.fillRect(cx - 14, trayY + i*3, 28, 1.5); }
        }
    });

    ctx.drawImage(sprite, d.x - offsetX, d.y - offsetY);
};
