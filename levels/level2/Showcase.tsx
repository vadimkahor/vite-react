
import React, { useRef, useEffect, useCallback } from 'react';
import { LEVEL2_CONFIG } from './config';
import { Level2State, Platform, Decoration } from './types';
import { drawLevel2 } from './render';
import { generateBackground } from './generator';
import { DESK_CONFIG } from './render/Desk';
import { SOFA_CONFIG } from './render/Sofa';
import { ARMCHAIR_CONFIG } from './render/Armchair';
import { MEETING_TABLE_CONFIG } from './render/MeetingTable';
import { PLATFORM_CONFIG } from './render/Platform';
import { FILE_CABINET_CONFIG } from './render/FileCabinet';
import { METAL_RACK_CONFIG } from './render/MetalRack';
import { SMALL_BOOK_SHELF_CONFIG } from './render/SmallBookShelf';
import { AIR_CONDITIONER_CONFIG } from './render/AirConditioner';
import { XEROX_CONFIG } from './render/Xerox';
import { VENDING_CONFIG } from './render/Vending';
import { ELECTRIC_BOX_CONFIG } from './render/ElectricBox';
import { BIG_TRASHCAN_CONFIG } from './render/BigTrashcan';
import { BOOK_CABINET_CONFIG } from './render/BookCabinet';
import { CRATE_CONFIG } from './render/Crate';

interface ShowcaseProps {
    onBack: () => void;
}

interface ShowcaseLabel {
    x: number;
    y: number;
    text: string;
}

const Showcase: React.FC<ShowcaseProps> = ({ onBack }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);
    const labelsRef = useRef<ShowcaseLabel[]>([]);

    const stateRef = useRef<Level2State>({
        player: {
            x: 100,
            y: 0, 
            vx: 0, vy: 0,
            width: LEVEL2_CONFIG.PLAYER_WIDTH,
            height: LEVEL2_CONFIG.PLAYER_HEIGHT,
            isGrounded: true, isJumping: false, isBoosted: false, facingRight: true, frameTimer: 0,
            currentPlatformType: null,
            hp: 3,
            invulnerableTimer: 0
        },
        platforms: [],
        decorations: [],
        enemies: [],
        boss: null,
        projectiles: [],
        lastEnemySpawnX: 0,
        backgroundElements: [],
        speedLines: [],
        cameraX: 0,
        maxCameraX: 0,
        shake: { x: 0, y: 0 },
        score: 0,
        gameTime: 0,
        levelLength: 20000,
        wasScreaming: false,
        katyaSpeechCooldown: 0
    });

    useEffect(() => {
        const platforms: Platform[] = [];
        const decorations: Decoration[] = [];
        const labels: ShowcaseLabel[] = [];
        
        const floorY = window.innerHeight - LEVEL2_CONFIG.FLOOR_HEIGHT;
        
        // Высоты ярусов (Обновленные для комфортного прыжка)
        const TIER_1_Y_DESK = floorY - DESK_CONFIG.HEIGHT;
        const TIER_2_Y = floorY - FILE_CABINET_CONFIG.HEIGHT; // 160px
        const TIER_3_Y = floorY - 260; // 260px
        const TIER_4_Y = floorY - 360; // 360px

        // Настройка игрока
        stateRef.current.player.y = floorY - LEVEL2_CONFIG.PLAYER_HEIGHT;

        let currentX = 150;
        const spacing = 180;

        // --- SECTION 1: DESK VARIATIONS ---
        const addDesk = (label: string, decos: {type: Decoration['type'], variant?: number, xOff?: number}[]) => {
            const deskW = 120;
            platforms.push({ x: currentX, y: TIER_1_Y_DESK, width: deskW, height: DESK_CONFIG.HEIGHT, type: 'desk' });
            decos.forEach(d => {
                decorations.push({ 
                    x: currentX + (d.xOff || 15), 
                    y: TIER_1_Y_DESK, 
                    type: d.type, 
                    variant: d.variant || 0 
                });
            });
            labels.push({ x: currentX + deskW/2, y: TIER_1_Y_DESK - 60, text: label });
            currentX += spacing;
        };

        addDesk("DESK (PC CYAN)", [{ type: 'computer', variant: 0, xOff: 20 }]);
        addDesk("DESK (PC RED)", [{ type: 'computer', variant: 1, xOff: 20 }]);
        addDesk("DESK (PC OFF)", [{ type: 'computer', variant: 2, xOff: 20 }]);
        
        addDesk("DESK (PLANT 1)", [{ type: 'plant', variant: 0, xOff: 40 }]);
        addDesk("DESK (PLANT 2)", [{ type: 'plant', variant: 1, xOff: 40 }]);
        addDesk("DESK (PLANT 3)", [{ type: 'plant', variant: 2, xOff: 40 }]);
        
        addDesk("DESK (LAMP)", [{ type: 'desk_lamp', variant: 0, xOff: 40 }]);

        // All Paper variants
        addDesk("PAPERS (S)", [{ type: 'papers', variant: 0, xOff: 30 }]);
        addDesk("PAPERS (M)", [{ type: 'papers', variant: 1, xOff: 30 }]);
        addDesk("PAPERS (L)", [{ type: 'papers', variant: 2, xOff: 30 }]);
        addDesk("PAPERS (MIX)", [{ type: 'papers', variant: 3, xOff: 20 }]);
        
        addDesk("DESK (ITEMS)", [{ type: 'phone', xOff: 15 }, { type: 'coffee', xOff: 80 }]);

        // --- SECTION 2: FLOOR FURNITURE & DECOR ---
        currentX += 50;
        
        // Lights
        decorations.push({ x: currentX, y: floorY, type: 'floor_lamp', variant: 0 });
        labels.push({ x: currentX + 30, y: floorY - 180, text: "FLOOR LAMP" });
        currentX += 120;

        // Wall Objects (Low Clock)
        decorations.push({ x: currentX, y: TIER_2_Y + 20, type: 'clock', variant: 2 });
        labels.push({ x: currentX + 20, y: TIER_2_Y - 40, text: "CLOCK (LOW)" });
        currentX += 150;

        // FLOOR PLANTS
        for(let i = 0; i < 4; i++) {
            decorations.push({ x: currentX, y: floorY, type: 'floor_plant', variant: i });
            labels.push({ x: currentX + 20, y: floorY - 160, text: `FLOOR PLANT ${i+1}` });
            currentX += 120;
        }
        currentX += 50;

        // Small Trashcans
        decorations.push({ x: currentX, y: floorY, type: 'trashcan', variant: 1 });
        labels.push({ x: currentX + 20, y: floorY - 60, text: "TRASH BLACK (F)" });
        currentX += 100;
        decorations.push({ x: currentX, y: floorY, type: 'trashcan', variant: 3 });
        labels.push({ x: currentX + 20, y: floorY - 60, text: "TRASH SILVER (F)" });
        currentX += 150;

        // Big Trashcans
        for (let i = 2; i <= 4; i++) {
            const bw = i * BIG_TRASHCAN_CONFIG.SECTION_WIDTH;
            platforms.push({ x: currentX, y: floorY - BIG_TRASHCAN_CONFIG.HEIGHT, width: bw, height: BIG_TRASHCAN_CONFIG.HEIGHT, type: 'big_trashcan' });
            labels.push({ x: currentX + bw/2, y: floorY - BIG_TRASHCAN_CONFIG.HEIGHT - 20, text: `BIG TRASH ${i}S` });
            currentX += bw + 100;
        }
        currentX += 50;

        // Cooler
        decorations.push({ x: currentX, y: floorY, type: 'cooler', variant: 0 });
        labels.push({ x: currentX + 30, y: floorY - 180, text: "COOLER" });
        currentX += 120;

        // TV
        decorations.push({ x: currentX, y: floorY, type: 'tv', variant: 0 });
        labels.push({ x: currentX + 60, y: floorY - 180, text: "TV STAND" });
        currentX += 180;

        // Boxes
        decorations.push({ x: currentX, y: floorY, type: 'boxes', variant: 0 });
        labels.push({ x: currentX + 48, y: floorY - 160, text: "BOXES" });
        currentX += 180;

        // Xerox
        platforms.push({ x: currentX, y: floorY - XEROX_CONFIG.HEIGHT, width: XEROX_CONFIG.WIDTH, height: XEROX_CONFIG.HEIGHT, type: 'xerox' });
        labels.push({ x: currentX + XEROX_CONFIG.WIDTH/2, y: floorY - XEROX_CONFIG.HEIGHT - 20, text: "XEROX" });
        currentX += XEROX_CONFIG.WIDTH + 100;

        // Vending
        platforms.push({ x: currentX, y: floorY - VENDING_CONFIG.HEIGHT, width: VENDING_CONFIG.WIDTH, height: VENDING_CONFIG.HEIGHT, type: 'vending' });
        labels.push({ x: currentX + VENDING_CONFIG.WIDTH/2, y: floorY - VENDING_CONFIG.HEIGHT - 20, text: "VENDING" });
        currentX += VENDING_CONFIG.WIDTH + 100;

        // Sofa & Armchair
        platforms.push({ x: currentX, y: floorY - SOFA_CONFIG.HEIGHT, width: SOFA_CONFIG.WIDTH, height: SOFA_CONFIG.HEIGHT, type: 'sofa' });
        labels.push({ x: currentX + SOFA_CONFIG.WIDTH/2, y: floorY - SOFA_CONFIG.HEIGHT - 20, text: "SOFA" });
        currentX += SOFA_CONFIG.WIDTH + 100;

        platforms.push({ x: currentX, y: floorY - ARMCHAIR_CONFIG.HEIGHT, width: ARMCHAIR_CONFIG.WIDTH, height: ARMCHAIR_CONFIG.HEIGHT, type: 'armchair' });
        labels.push({ x: currentX + ARMCHAIR_CONFIG.WIDTH/2, y: floorY - ARMCHAIR_CONFIG.HEIGHT - 20, text: "ARMCHAIR" });
        currentX += ARMCHAIR_CONFIG.WIDTH + 100;

        // Meeting Table ALL SIZES
        const tableW1 = MEETING_TABLE_CONFIG.WIDTH;
        platforms.push({ x: currentX, y: floorY - MEETING_TABLE_CONFIG.HEIGHT, width: tableW1, height: MEETING_TABLE_CONFIG.HEIGHT, type: 'meeting_table' });
        labels.push({ x: currentX + tableW1/2, y: floorY - MEETING_TABLE_CONFIG.HEIGHT - 20, text: "TABLE X1" });
        currentX += tableW1 + 120;

        const tableW2 = MEETING_TABLE_CONFIG.WIDTH_X2;
        platforms.push({ x: currentX, y: floorY - MEETING_TABLE_CONFIG.HEIGHT, width: tableW2, height: MEETING_TABLE_CONFIG.HEIGHT, type: 'meeting_table' });
        labels.push({ x: currentX + tableW2/2, y: floorY - MEETING_TABLE_CONFIG.HEIGHT - 20, text: "TABLE X2" });
        currentX += tableW2 + 120;

        const tableW3 = MEETING_TABLE_CONFIG.WIDTH_X3;
        platforms.push({ x: currentX, y: floorY - MEETING_TABLE_CONFIG.HEIGHT, width: tableW3, height: MEETING_TABLE_CONFIG.HEIGHT, type: 'meeting_table' });
        labels.push({ x: currentX + tableW3/2, y: floorY - MEETING_TABLE_CONFIG.HEIGHT - 20, text: "TABLE X3" });
        currentX += tableW3 + 150;

        // CRATE
        platforms.push({ x: currentX, y: floorY - CRATE_CONFIG.HEIGHT, width: CRATE_CONFIG.WIDTH, height: CRATE_CONFIG.HEIGHT, type: 'crate' });
        labels.push({ x: currentX + CRATE_CONFIG.WIDTH/2, y: floorY - CRATE_CONFIG.HEIGHT - 20, text: "CRATE" });
        currentX += CRATE_CONFIG.WIDTH + 100;

        // --- SECTION 3: TIER 2 (HIGH OBJECTS) ---

        // File Cabinet
        platforms.push({ x: currentX, y: TIER_2_Y, width: FILE_CABINET_CONFIG.WIDTH, height: FILE_CABINET_CONFIG.HEIGHT, type: 'file_cabinet' });
        labels.push({ x: currentX + FILE_CABINET_CONFIG.WIDTH/2, y: TIER_2_Y - 20, text: "CABINET" });
        currentX += FILE_CABINET_CONFIG.WIDTH + 100;

        // Book Cabinet ALL SIZES
        const bookW1 = BOOK_CABINET_CONFIG.BASE_WIDTH;
        platforms.push({ x: currentX, y: TIER_2_Y, width: bookW1, height: BOOK_CABINET_CONFIG.HEIGHT, type: 'book_cabinet' });
        labels.push({ x: currentX + bookW1/2, y: TIER_2_Y - 20, text: "BOOKS X1" });
        currentX += bookW1 + 100;

        const bookW15 = BOOK_CABINET_CONFIG.BASE_WIDTH * 1.5;
        platforms.push({ x: currentX, y: TIER_2_Y, width: bookW15, height: BOOK_CABINET_CONFIG.HEIGHT, type: 'book_cabinet' });
        labels.push({ x: currentX + bookW15/2, y: TIER_2_Y - 20, text: "BOOKS WIDE" });
        currentX += bookW15 + 100;

        const bookW2 = BOOK_CABINET_CONFIG.BASE_WIDTH * 2.0;
        platforms.push({ x: currentX, y: TIER_2_Y, width: bookW2, height: BOOK_CABINET_CONFIG.HEIGHT, type: 'book_cabinet' });
        labels.push({ x: currentX + bookW2/2, y: TIER_2_Y - 20, text: "BOOKS X2" });
        currentX += bookW2 + 150;

        // Metal Rack ALL SIZES
        const rackW1 = METAL_RACK_CONFIG.BASE_WIDTH;
        platforms.push({ x: currentX, y: floorY - METAL_RACK_CONFIG.HEIGHT, width: rackW1, height: METAL_RACK_CONFIG.HEIGHT, type: 'metal_rack' });
        labels.push({ x: currentX + rackW1/2, y: TIER_2_Y - 20, text: "RACK X1" });
        currentX += rackW1 + 100;

        const rackW15 = METAL_RACK_CONFIG.BASE_WIDTH * 1.5;
        platforms.push({ x: currentX, y: floorY - METAL_RACK_CONFIG.HEIGHT, width: rackW15, height: METAL_RACK_CONFIG.HEIGHT, type: 'metal_rack' });
        labels.push({ x: currentX + rackW15/2, y: TIER_2_Y - 20, text: "RACK WIDE" });
        currentX += rackW15 + 100;

        const rackW2 = METAL_RACK_CONFIG.BASE_WIDTH * 2.0;
        platforms.push({ x: currentX, y: floorY - METAL_RACK_CONFIG.HEIGHT, width: rackW2, height: METAL_RACK_CONFIG.HEIGHT, type: 'metal_rack' });
        labels.push({ x: currentX + rackW2/2, y: TIER_2_Y - 20, text: "RACK X2" });
        currentX += rackW2 + 150;

        // Small Bookshelf
        platforms.push({ x: currentX, y: TIER_2_Y, width: SMALL_BOOK_SHELF_CONFIG.WIDTH, height: SMALL_BOOK_SHELF_CONFIG.HEIGHT, type: 'small_book_shelf' });
        labels.push({ x: currentX + SMALL_BOOK_SHELF_CONFIG.WIDTH/2, y: TIER_2_Y - 20, text: "BOOKSHELF" });
        currentX += SMALL_BOOK_SHELF_CONFIG.WIDTH + 150;

        // --- SECTION 4: AIR OBJECTS (TIER 3 & 4) ---

        // AC & Electric Box (TIER 3)
        platforms.push({ x: currentX, y: TIER_3_Y, width: AIR_CONDITIONER_CONFIG.WIDTH, height: AIR_CONDITIONER_CONFIG.HEIGHT, type: 'air_conditioner' });
        labels.push({ x: currentX + AIR_CONDITIONER_CONFIG.WIDTH/2, y: TIER_3_Y - 20, text: "AC (T3)" });
        currentX += AIR_CONDITIONER_CONFIG.WIDTH + 100;

        platforms.push({ x: currentX, y: TIER_3_Y, width: ELECTRIC_BOX_CONFIG.WIDTH, height: ELECTRIC_BOX_CONFIG.HEIGHT, type: 'electric_box' });
        labels.push({ x: currentX + ELECTRIC_BOX_CONFIG.WIDTH/2, y: TIER_3_Y - 20, text: "E-BOX (T3)" });
        currentX += ELECTRIC_BOX_CONFIG.WIDTH + 100;

        // Platforms ALL SIZES
        const platW1 = PLATFORM_CONFIG.WIDTH;
        platforms.push({ x: currentX, y: TIER_3_Y, width: platW1, height: PLATFORM_CONFIG.HEIGHT, type: 'platform' });
        labels.push({ x: currentX + platW1/2, y: TIER_3_Y - 20, text: "PLAT X1 (T3)" });
        currentX += platW1 + 120;

        const platW2 = PLATFORM_CONFIG.MEDIUM_WIDTH;
        platforms.push({ x: currentX, y: TIER_4_Y, width: platW2, height: PLATFORM_CONFIG.HEIGHT, type: 'platform' });
        labels.push({ x: currentX + platW2/2, y: TIER_4_Y - 20, text: "PLAT X2 (T4)" });
        currentX += platW2 + 120;

        const platW3 = PLATFORM_CONFIG.LARGE_WIDTH;
        platforms.push({ x: currentX, y: TIER_4_Y, width: platW3, height: PLATFORM_CONFIG.HEIGHT, type: 'platform' });
        labels.push({ x: currentX + platW3/2, y: TIER_4_Y - 20, text: "PLAT X3 (T4)" });
        currentX += platW3 + 200;
        
        currentX += 500; 
        
        stateRef.current.levelLength = currentX;
        stateRef.current.platforms = platforms;
        stateRef.current.decorations = decorations;
        stateRef.current.backgroundElements = generateBackground(currentX);
        labelsRef.current = labels;
        lastTimeRef.current = 0;
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const scrollSpeed = 50; 
            const state = stateRef.current;
            if (e.key === 'ArrowRight') state.cameraX += scrollSpeed;
            else if (e.key === 'ArrowLeft') state.cameraX -= scrollSpeed;
            if (state.cameraX < 0) state.cameraX = 0;
            if (state.levelLength) {
                const maxScroll = state.levelLength + 400 - window.innerWidth;
                if (state.cameraX > maxScroll) state.cameraX = maxScroll;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const loop = useCallback((time: number) => {
        const canvas = canvasRef.current;
        if (!canvas) { requestRef.current = requestAnimationFrame(loop); return; }
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        if (!lastTimeRef.current) lastTimeRef.current = time;
        const dt = time - lastTimeRef.current;
        lastTimeRef.current = time;
        const timeScale = dt / (1000 / 60);
        stateRef.current.gameTime += 1 * timeScale;
        drawLevel2(ctx, stateRef.current, canvas.width, canvas.height);
        ctx.fillStyle = 'white'; 
        ctx.font = 'bold 10px Inter'; 
        ctx.textAlign = 'center'; 
        ctx.shadowColor = 'black'; ctx.shadowBlur = 3;
        labelsRef.current.forEach(label => {
             const cx = label.x - stateRef.current.cameraX;
             if (cx > -100 && cx < canvas.width + 100) {
                 ctx.fillText(label.text, cx, label.y);
             }
        });
        ctx.shadowBlur = 0;
        requestRef.current = requestAnimationFrame(loop);
    }, []);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(loop);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [loop]);

    const handleWheel = (e: React.WheelEvent) => {
        const state = stateRef.current;
        state.cameraX += e.deltaY;
        if (state.cameraX < 0) state.cameraX = 0;
        if (state.levelLength) {
             const maxScroll = state.levelLength + 400 - window.innerWidth;
             if (state.cameraX > maxScroll) state.cameraX = maxScroll;
        }
    };

    return (
        <div className="relative w-full h-full bg-slate-300" onWheel={handleWheel}>
            <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} className="block" style={{ transform: 'translateZ(0)' }} />
            <div className="absolute top-0 left-0 w-full p-4 bg-black/50 backdrop-blur-sm text-white flex justify-between items-center z-50">
                <div>
                    <h1 className="font-orbitron font-bold text-xl text-pink-500">OBJECT SHOWCASE</h1>
                    <p className="text-xs text-slate-300 font-inter">SCROLL TO VIEW ALL ITEMS (ALL SIZES)</p>
                </div>
                <button onClick={onBack} className="px-6 py-2 bg-slate-700 hover:bg-white hover:text-black border border-slate-500 rounded font-orbitron font-bold text-sm transition-all">BACK</button>
            </div>
        </div>
    );
};

export default Showcase;
