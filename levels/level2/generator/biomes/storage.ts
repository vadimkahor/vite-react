
import { Platform, Decoration } from '../../types';
import { createDecoration, getRandomItem } from '../entities';
import { tryGenerateAirLayer } from '../rules/air-layer';

import { METAL_RACK_CONFIG } from '../../render/MetalRack';
import { FILE_CABINET_CONFIG } from '../../render/FileCabinet';
import { BOOK_CABINET_CONFIG } from '../../render/BookCabinet';
import { CRATE_CONFIG } from '../../render/Crate';
import { SMALL_BOOK_SHELF_CONFIG } from '../../render/SmallBookShelf';

const isCrateTooClose = (platforms: Platform[], x: number): boolean => {
    // Check backwards for the nearest crate
    for (let i = platforms.length - 1; i >= 0; i--) {
        const p = platforms[i];
        if (p.type === 'crate') {
            const endX = p.x + p.width;
            const dist = x - endX;
            // Only care if x is after the previous crate
            if (dist >= 0) {
                return dist < 100;
            }
        }
    }
    return false;
};

export const generateStorageBiome = (platforms: Platform[], decorations: Decoration[], startX: number, floorY: number): number => {
    const count = 3 + Math.floor(Math.random() * 3); // 3-5 items
    let currentX = startX;

    for (let i = 0; i < count; i++) {
        // --- STEP CONFIGURATION LOGIC ---
        const structRoll = Math.random();
        let hasLeftCrate = false;
        let hasRightCrate = false;

        if (structRoll < 0.45) {
            // 45% Chance: Step Up (Left Only)
            hasLeftCrate = true;
        } else if (structRoll < 0.90) {
            // 45% Chance: Step Down (Right Only)
            hasRightCrate = true;
        } 
        // 10% Chance: Solo Tower (No crates)

        // 1. Left Crate
        if (hasLeftCrate) {
            // Check proximity to previous crate (e.g. from gap)
            if (isCrateTooClose(platforms, currentX)) {
                hasLeftCrate = false; // Cancel if too close
            } else {
                platforms.push({ 
                    x: currentX, 
                    y: floorY - CRATE_CONFIG.HEIGHT, 
                    width: CRATE_CONFIG.WIDTH, 
                    height: CRATE_CONFIG.HEIGHT, 
                    type: 'crate' 
                });
                currentX += CRATE_CONFIG.WIDTH + 5; 
            }
        }

        // 2. High Object (Rack / Cabinet)
        const type = getRandomItem(['metal_rack', 'book_cabinet', 'file_cabinet', 'small_book_shelf'] as const);
        
        let w = 0;
        let h = 0;
        let y = 0;
        
        if (type === 'small_book_shelf') {
            w = SMALL_BOOK_SHELF_CONFIG.WIDTH;
            h = SMALL_BOOK_SHELF_CONFIG.HEIGHT;
            y = floorY - 160; 
        } else {
            h = 160;
            y = floorY - h;

            if (type === 'metal_rack') {
                const roll = Math.random();
                const mult = roll < 0.3 ? 1.0 : (roll < 0.7 ? 1.5 : 2.0);
                w = METAL_RACK_CONFIG.BASE_WIDTH * mult;
            } else if (type === 'book_cabinet') {
                const roll = Math.random();
                const mult = roll < 0.3 ? 1.0 : (roll < 0.7 ? 1.5 : 2.0);
                w = BOOK_CABINET_CONFIG.BASE_WIDTH * mult;
            } else {
                w = FILE_CABINET_CONFIG.WIDTH;
            }
        }
        
        platforms.push({ x: currentX, y: y, width: w, height: h, type });
        
        let structureEndX = currentX + w;

        // 3. Right Crate
        if (hasRightCrate) {
            const rightCrateX = structureEndX + 5;
            if (isCrateTooClose(platforms, rightCrateX)) {
                hasRightCrate = false;
            } else {
                platforms.push({ 
                    x: rightCrateX, 
                    y: floorY - CRATE_CONFIG.HEIGHT, 
                    width: CRATE_CONFIG.WIDTH, 
                    height: CRATE_CONFIG.HEIGHT, 
                    type: 'crate' 
                });
                structureEndX += 5 + CRATE_CONFIG.WIDTH;
            }
        }

        // --- GAP & GROUND OBJECTS LOGIC ---
        if (i < count - 1) {
            const gap = 120 + Math.random() * 60; 
            const midGapX = structureEndX + gap/2;
            
            // Generate Ground Objects: High chance (90%)
            if (Math.random() < 0.9) {
                // 50/50 Split between Decoration (Boxes OR Plant) and Obstacle (Crate)
                const tryCrate = Math.random() >= 0.5;
                let placedCrate = false;

                if (tryCrate) {
                     // Platform (Must jump)
                     // Center the crate in the gap
                     const crateX = midGapX - (CRATE_CONFIG.WIDTH / 2);
                     
                     if (!isCrateTooClose(platforms, crateX)) {
                         platforms.push({ 
                            x: crateX, 
                            y: floorY - CRATE_CONFIG.HEIGHT, 
                            width: CRATE_CONFIG.WIDTH, 
                            height: CRATE_CONFIG.HEIGHT, 
                            type: 'crate' 
                        });
                        placedCrate = true;
                     }
                }
                
                if (!placedCrate) {
                     // Decoration (Pass-through) - Fallback if crate blocked or not selected
                     const deco = getRandomItem(['boxes', 'floor_plant', 'floor_plant'] as const);
                     decorations.push(createDecoration(midGapX - 20, floorY, deco));
                }
            }

            tryGenerateAirLayer(platforms, midGapX, floorY, 'mixed');
            
            currentX = structureEndX + gap;
        } else {
            currentX = structureEndX;
        }
    }
    
    // Trailing Crate (Low chance)
    if (Math.random() < 0.15) {
        currentX += 10;
        if (!isCrateTooClose(platforms, currentX)) {
            platforms.push({ 
                x: currentX, 
                y: floorY - CRATE_CONFIG.HEIGHT, 
                width: CRATE_CONFIG.WIDTH, 
                height: CRATE_CONFIG.HEIGHT, 
                type: 'crate' 
            });
            currentX += CRATE_CONFIG.WIDTH;
        }
    }

    return currentX + 60;
};
