
import { Platform, Decoration } from '../../types';
import { createDecoration, getRandomItem } from '../entities';
import { generatorState } from '../state';
import { tryGenerateAirLayer } from '../rules/air-layer';

import { DESK_CONFIG } from '../../render/Desk';
import { FILE_CABINET_CONFIG } from '../../render/FileCabinet';
import { BOOK_CABINET_CONFIG } from '../../render/BookCabinet';
import { BIG_TRASHCAN_CONFIG } from '../../render/BigTrashcan';
import { XEROX_CONFIG } from '../../render/Xerox';
import { SMALL_BOOK_SHELF_CONFIG } from '../../render/SmallBookShelf';

export const generateOfficeBiome = (platforms: Platform[], decorations: Decoration[], startX: number, floorY: number): number => {
    const groupSize = 3 + Math.floor(Math.random() * 4); 
    let currentX = startX;

    for (let i = 0; i < groupSize; i++) {
        const dw = DESK_CONFIG.WIDTH;
        const dh = DESK_CONFIG.HEIGHT;
        
        // 1. ALWAYS Place Desk
        platforms.push({ x: currentX, y: floorY - dh, width: dw, height: dh, type: 'desk' });

        // 2. Air Layer (Jump path)
        if (Math.random() < 0.5) {
            tryGenerateAirLayer(platforms, currentX + dw/2, floorY, 'mixed');
        }

        // 3. Desk Decoration
        const roll = Math.random();
        
        const computerVariant = i % 3; 
        const plantVariant = i % 3;
        const paperVariant = i % 4;

        if (roll < 0.6) {
             // Computer Desk
             decorations.push(createDecoration(currentX + 25, floorY - dh, 'computer', computerVariant));
             if (Math.random() < 0.5) decorations.push(createDecoration(currentX + 85, floorY - dh, 'coffee'));
        } else if (roll < 0.85) {
             const items = ['plant', 'papers', 'phone', 'coffee', 'desk_lamp'] as const;
             const itemIndex = (i + Math.floor(roll * 10)) % items.length;
             const item = items[itemIndex];
             
             let variant = 0;
             if (item === 'plant') variant = plantVariant;
             if (item === 'papers') variant = paperVariant;
             
             decorations.push(createDecoration(currentX + 40, floorY - dh, item, variant));
        } else {
             // Cluttered Desk
             if (Math.random() > 0.5) {
                decorations.push(createDecoration(currentX + 20, floorY - dh, 'desk_lamp'));
             } else {
                decorations.push(createDecoration(currentX + 20, floorY - dh, 'phone'));
             }
             decorations.push(createDecoration(currentX + 80, floorY - dh, 'papers', paperVariant));
        }

        // 4. Wall Clock
        if (i % 3 === 0) {
            const clockX = currentX + dw/2;
            if (generatorState.canPlaceClock(clockX)) {
                 decorations.push(createDecoration(clockX, floorY - 220, 'clock'));
                 generatorState.registerClock(clockX);
            }
        }

        // 5. Gap / Spacer logic
        if (i < groupSize - 1) {
            const spacerRoll = Math.random();
            
            if (spacerRoll < 0.65) {
                // PLATFORM SPACER
                const gapBefore = 40;
                const gapAfter = 40;
                const typeRoll = Math.random();
                
                if (typeRoll < 0.15) {
                    const sections = 2 + Math.floor(Math.random() * 3);
                    const bw = sections * BIG_TRASHCAN_CONFIG.SECTION_WIDTH;
                    currentX += dw + gapBefore;
                    platforms.push({ x: currentX, y: floorY - BIG_TRASHCAN_CONFIG.HEIGHT, width: bw, height: BIG_TRASHCAN_CONFIG.HEIGHT, type: 'big_trashcan' });
                    
                    if (Math.random() < 0.6) tryGenerateAirLayer(platforms, currentX + bw/2, floorY, 'tier3');
                    
                    currentX += bw + gapAfter;
                } else {
                    const sepType = getRandomItem(['file_cabinet', 'book_cabinet', 'xerox', 'small_book_shelf'] as const);
                    
                    let w = 0;
                    let h = 0;
                    let y = 0;

                    if (sepType === 'small_book_shelf') {
                        w = SMALL_BOOK_SHELF_CONFIG.WIDTH;
                        h = SMALL_BOOK_SHELF_CONFIG.HEIGHT;
                        y = floorY - 160; 
                    } else {
                        y = floorY; 
                        if (sepType === 'book_cabinet') {
                            const mult = Math.random() < 0.3 ? 1.5 : 1.0; 
                            w = BOOK_CABINET_CONFIG.BASE_WIDTH * mult;
                            h = BOOK_CABINET_CONFIG.HEIGHT;
                            y -= h;
                        } else if (sepType === 'xerox') {
                            w = XEROX_CONFIG.WIDTH;
                            h = XEROX_CONFIG.HEIGHT;
                            y -= h;
                        } else {
                            w = FILE_CABINET_CONFIG.WIDTH;
                            h = FILE_CABINET_CONFIG.HEIGHT;
                            y -= h;
                        }
                    }
                    
                    currentX += dw + gapBefore;
                    platforms.push({ x: currentX, y: y, width: w, height: h, type: sepType });
                    
                    if (Math.random() < 0.7) tryGenerateAirLayer(platforms, currentX + w/2, floorY, 'tier3');
                    currentX += w + gapAfter;
                }
            } 
            else if (spacerRoll < 0.90) { 
                // DECORATION SPACER (TV, Boxes, etc)
                // INCREASED FLOOR_PLANT PROBABILITY: Added 'floor_plant' multiple times to the array
                const decoType = getRandomItem([
                    'trashcan', 
                    'floor_plant', 'floor_plant', 'floor_plant', 
                    'floor_lamp', 
                    'boxes', 
                    'tv'
                ] as const);
                
                let itemWidth = 50; // default narrow
                if (decoType === 'tv') itemWidth = 120;
                else if (decoType === 'boxes') itemWidth = 100;
                else if (decoType === 'floor_plant') itemWidth = 80;
                else if (decoType === 'floor_lamp') itemWidth = 60;
                
                // Add padding: 30px from desk + item + 30px to next desk
                const gap = 30 + itemWidth + 30;
                
                let decoX = currentX + dw + 30;

                // Adjust specific sprite offsets if needed to center visual mass
                if (decoType === 'boxes') decoX += 10;
                if (decoType === 'floor_plant') decoX += 20;
                
                let decoVariant = undefined;
                if (decoType === 'floor_plant') decoVariant = i % 4;

                decorations.push(createDecoration(decoX, floorY, decoType, decoVariant));
                
                if (decoType === 'tv') {
                     tryGenerateAirLayer(platforms, decoX + 60, floorY, 'tier4');
                } else if (Math.random() < 0.5) {
                     tryGenerateAirLayer(platforms, decoX + itemWidth/2, floorY, 'mixed');
                }

                currentX += dw + gap;
            } 
            else {
                // EMPTY SPACER
                if (Math.random() < 0.4) tryGenerateAirLayer(platforms, currentX + dw + 15, floorY, 'mixed');
                currentX += dw + 60; // Increased base gap slightly
            }
        } else {
            currentX += dw;
        }
    }
    
    // Trailing decoration
    if (Math.random() < 0.6) {
        // Added floor_plant to trailing options as well
        const trailType = getRandomItem(['trashcan', 'boxes', 'floor_plant'] as const);
        const trailGap = trailType === 'boxes' ? 120 : (trailType === 'floor_plant' ? 100 : 60);
        decorations.push(createDecoration(currentX + 30, floorY, trailType));
        currentX += trailGap;
    }

    return currentX + 50;
};
