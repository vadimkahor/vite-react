
import React, { useRef, useEffect } from 'react';
import { drawSecretary, SECRETARY_CONFIG } from './enemies/Secretary';

interface SecretaryShowcaseProps {
    onBack: () => void;
}

const SecretaryShowcase: React.FC<SecretaryShowcaseProps> = ({ onBack }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);
    const timerRef = useRef(0);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;

        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#1e293b'); // Dark Slate
        grad.addColorStop(1, '#0f172a'); // Darker Slate
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Floor
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, h - 120, w, 120);
        
        // Floor details (Reflections)
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        for(let i=0; i<w; i+=100) {
            ctx.beginPath(); ctx.moveTo(i, h-120); ctx.lineTo(i-40, h); ctx.lineTo(i-38, h); ctx.lineTo(i+2, h-120); ctx.fill();
        }

        // Title
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 36px Orbitron';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#f472b6'; ctx.shadowBlur = 10;
        ctx.fillText('EVIL SECRETARY', w / 2, 80);
        ctx.shadowBlur = 0;
        
        ctx.font = '16px Inter';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('HIGH FIDELITY BOSS MODEL', w / 2, 115);

        timerRef.current++;

        // Draw Variants (Now only one)
        const variants = SECRETARY_CONFIG.VARIANTS;
        const yPos = h - 120 - SECRETARY_CONFIG.HEIGHT + 30; // 30px overlap with floor for perspective

        // Draw the single Supervisor model in the center
        const v = variants[0];
        const index = 0;
        const xPos = w / 2;
        
        // Draw Spotlight
        ctx.save();
        ctx.translate(xPos, h - 120);
        ctx.scale(1, 0.3);
        const spotGrad = ctx.createRadialGradient(0, 0, 20, 0, 0, 140);
        spotGrad.addColorStop(0, 'rgba(255,255,255,0.2)');
        spotGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = spotGrad;
        ctx.beginPath(); ctx.arc(0, 0, 140, 0, Math.PI*2); ctx.fill();
        ctx.restore();

        // Draw Character (Centered)
        drawSecretary(ctx, xPos - SECRETARY_CONFIG.WIDTH/2, yPos, index, timerRef.current);

        // Draw Label
        ctx.fillStyle = '#facc15'; // Yellow
        ctx.font = 'bold 20px Orbitron';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'black'; ctx.shadowBlur = 4;
        ctx.fillText(v.name, xPos, h - 70);
        
        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'italic 12px Inter';
        ctx.fillText('"Is this report a joke?"', xPos, h - 45);
        ctx.shadowBlur = 0;

        requestRef.current = requestAnimationFrame(draw);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(draw);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    return (
        <div className="relative w-full h-full bg-slate-900">
            <canvas 
                ref={canvasRef} 
                width={window.innerWidth} 
                height={window.innerHeight} 
                className="block"
            />
            <div className="absolute bottom-10 left-0 w-full flex justify-center gap-4">
                <button 
                    onClick={onBack}
                    className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-orbitron font-bold rounded shadow-lg border border-slate-500 transition-all hover:scale-105"
                >
                    BACK TO MENU
                </button>
            </div>
        </div>
    );
};

export default SecretaryShowcase;
