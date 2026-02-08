
import { Platform, Decoration } from '../../types';
import { createDecoration, getRandomItem } from '../entities';
import { tryGenerateAirLayer } from '../rules/air-layer';

import { PLATFORM_CONFIG } from '../../render/Platform';
import { XEROX_CONFIG } from '../../render/Xerox';
import { VENDING_CONFIG } from '../../render/Vending';
import { BIG_TRASHCAN_CONFIG } from '../../render/BigTrashcan';

export const generateTransitionBiome = (platforms: Platform[], decorations: Decoration[], startX: number, floorY: number): number => {
    let currentX = startX;
    
    currentX += 60;

    let objectWidth = 0;
    let objectCenter = currentX;

    const roll = Math.random();

    if (roll < 0.5) {
        // Machine (Xerox or Vending)
        const type = getRandomItem(['xerox', 'vending'] as const);
        const w = type === 'xerox' ? XEROX_CONFIG.WIDTH : VENDING_CONFIG.WIDTH;
        const h = type === 'xerox' ? XEROX_CONFIG.HEIGHT : VENDING_CONFIG.HEIGHT;
        
        platforms.push({ x: currentX, y: floorY - h, width: w, height: h, type });
        objectWidth = w;
        objectCenter = currentX + w/2;
    } else if (roll < 0.8) {
        // Trashcan Area
        const sections = 2 + Math.floor(Math.random() * 2); // 2 or 3
        const w = sections * BIG_TRASHCAN_CONFIG.SECTION_WIDTH;
        platforms.push({ x: currentX, y: floorY - BIG_TRASHCAN_CONFIG.HEIGHT, width: w, height: BIG_TRASHCAN_CONFIG.HEIGHT, type: 'big_trashcan' });
        
        objectWidth = w;
        objectCenter = currentX + w/2;

        if (Math.random() < 0.7) {
            // Add varied clutter next to big trashcans
            // INCREASED PLANT FREQUENCY HERE
            const clutter = getRandomItem(['floor_plant', 'floor_plant', 'boxes', 'trashcan'] as const);
            decorations.push(createDecoration(currentX + w + 30, floorY, clutter));
        }
    } else {
        // Just empty space with floor decor
        // INCREASED PLANT FREQUENCY HERE
        const decorType = getRandomItem([
            'floor_plant', 'floor_plant', 'floor_plant', 
            'trashcan', 
            'boxes', 
            'floor_lamp', 
            'tv'
        ] as const);
        
        // Calculate dynamic width for decor to prevent overlaps with next section
        let dw = 50;
        if (decorType === 'tv') dw = 120;
        else if (decorType === 'boxes') dw = 100;
        else if (decorType === 'floor_plant') dw = 80;
        
        decorations.push(createDecoration(currentX, floorY, decorType));
        objectWidth = dw;
        objectCenter = currentX + dw/2;
    }
    
    // --- AIR GENERATION ---
    tryGenerateAirLayer(platforms, objectCenter, floorY, 'mixed');

    // GAP Calculation
    const bridgeX = currentX + objectWidth + 80;
    
    tryGenerateAirLayer(platforms, bridgeX, floorY, 'mixed');
    
    return bridgeX + 60;
};
