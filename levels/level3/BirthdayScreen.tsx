
import React, { useEffect, useState, useRef } from 'react';

// Direct link to the provided image
const photo = 'https://allwebs.ru/images/2026/02/09/ad910fe0213be0904f3c2de00907889c.png';

interface ConfettiPiece {
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
    vx: number;
    vy: number;
    rot: number;
    vRot: number;
}

const COLORS = ['#f472b6', '#ec4899', '#db2777', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'];

const BirthdayScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
    // Fix: Explicitly allow null to make ref mutable
    const requestRef = useRef<number | null>(null);

    useEffect(() => {
        // Инициализация конфетти
        const initialPieces: ConfettiPiece[] = Array.from({ length: 100 }, (_, i) => ({
            id: i,
            x: Math.random() * window.innerWidth,
            y: -Math.random() * 200,
            size: 5 + Math.random() * 8,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            vx: (Math.random() - 0.5) * 4,
            vy: 3 + Math.random() * 5,
            rot: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 0.2
        }));
        setPieces(initialPieces);

        const loop = () => {
            setPieces(prev => prev.map(p => {
                let newY = p.y + p.vy;
                let newX = p.x + p.vx;
                if (newY > window.innerHeight) {
                    newY = -20;
                    newX = Math.random() * window.innerWidth;
                }
                return {
                    ...p,
                    x: newX,
                    y: newY,
                    rot: p.rot + p.vRot
                };
            }));
            requestRef.current = requestAnimationFrame(loop);
        };
        requestRef.current = requestAnimationFrame(loop);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[1000] bg-black/95 flex flex-col items-center justify-center p-4 md:p-8 animate-fade-in overflow-hidden">
            {/* Конфетти (появляется сразу) */}
            <div className="absolute inset-0 pointer-events-none opacity-0 animate-[fade-in_2s_ease-out_0.5s_forwards]">
                {pieces.map(p => (
                    <div 
                        key={p.id}
                        className="absolute"
                        style={{
                            left: p.x,
                            top: p.y,
                            width: p.size,
                            height: p.size * 1.5,
                            backgroundColor: p.color,
                            transform: `rotate(${p.rot}rad)`,
                            boxShadow: '0 0 5px rgba(255,255,255,0.2)'
                        }}
                    />
                ))}
            </div>

            {/* Праздничный текст (Появляется ПЕРВЫМ) */}
            <div className="mb-8 text-center opacity-0 animate-[fade-in_1.5s_ease-out_0.5s_forwards] z-20">
                <h1 className="text-4xl md:text-6xl font-orbitron font-black text-pink-500 tracking-tighter drop-shadow-[0_0_15px_rgba(236,72,153,0.6)] neon-text uppercase italic">
                    Happy birthday, Kate! &lt;3
                </h1>
            </div>

            {/* Рамка с фото (Появляется ВТОРОЙ из темноты) */}
            <div className="relative group max-w-full md:max-w-3xl opacity-0 animate-[fade-in_4s_ease-out_2.5s_forwards]">
                <div className="absolute -inset-2 bg-gradient-to-tr from-pink-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
                <div className="relative bg-slate-900 p-3 md:p-4 rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
                    <img 
                        src={photo} 
                        alt="Happy Birthday Kate" 
                        // Убран shadow-inner чтобы фото было светлее, добавлен brightness-105
                        className="w-full h-auto rounded-2xl object-cover max-h-[60vh] border border-black/20 brightness-105 transition-transform duration-700 group-hover:scale-[1.02]"
                    />
                </div>
            </div>

            {/* Кнопка выхода (Появляется ПОСЛЕДНЕЙ) */}
            <button 
                onClick={onBack}
                className="mt-12 px-8 py-3 bg-pink-600 hover:bg-pink-500 text-white font-orbitron font-bold rounded-full border border-pink-400/50 transition-all hover:scale-110 active:scale-95 shadow-[0_0_20px_rgba(236,72,153,0.3)] z-50 uppercase opacity-0 animate-[fade-in_1s_ease-out_5s_forwards]"
            >
                Вернуться в меню
            </button>
        </div>
    );
};

export default BirthdayScreen;
