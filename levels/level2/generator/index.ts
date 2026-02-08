
import { LEVEL2_CONFIG } from '../config';
import { Platform, Decoration, BackgroundElement } from '../types';
import { generatorState } from './state';
import { createDecoration } from './entities';
import { generateBackground } from './background';

import { generateStartBiome } from './biomes/start'; // Import Start Biome
import { generateOfficeBiome } from './biomes/office';
import { generateStorageBiome } from './biomes/storage';
import { generateLoungeBiome } from './biomes/lounge';
import { generateTransitionBiome } from './biomes/transition';

import { VENDING_CONFIG } from '../render/Vending';

export { generateBackground };

export const generateLevel = (): { platforms: Platform[], decorations: Decoration[], background: BackgroundElement[] } => {
    generatorState.reset();
    
    const platforms: Platform[] = [];
    const decorations: Decoration[] = [];
    
    const floorY = window.innerHeight - LEVEL2_CONFIG.FLOOR_HEIGHT;
    const levelLen = LEVEL2_CONFIG.LEVEL_LENGTH;
    
    // Fixed Landmarks (Vending Machines) targets
    const vending1X = Math.floor(levelLen * 0.33);
    const vending2X = Math.floor(levelLen * 0.66);
    
    let placedVending1 = false;
    let placedVending2 = false;
    
    // --- 1. START BIOME GENERATION ---
    // Start slightly after spawn (player spawns at x=50)
    let currentX = 250; 
    
    // Generate Fixed Start Sequence
    currentX = generateStartBiome(platforms, decorations, currentX, floorY);
    
    // --- 2. MANDATORY GAP ---
    currentX += 250; 

    // --- 3. MANDATORY OFFICE BIOME ---
    currentX = generateOfficeBiome(platforms, decorations, currentX, floorY);

    // --- 4. PROCEDURAL GENERATION (Rest of the level) ---
    // Stop generating objects 2000px before the end to leave a gap for the boss encounter
    const stopGenerationX = levelLen - 2000;
    
    while (currentX < stopGenerationX) {
        // 1. Check Vending Landmarks
        const dist1 = Math.abs(currentX - vending1X);
        const dist2 = Math.abs(currentX - vending2X);
        
        // Check if we are roughly in the zone OR if we passed it but haven't placed it yet
        const canPlaceVending1 = (dist1 < 500 || currentX > vending1X) && !placedVending1;
        const canPlaceVending2 = (dist2 < 500 || currentX > vending2X) && !placedVending2;
        
        if (canPlaceVending1 || canPlaceVending2) {
            // Mark as placed
            if (canPlaceVending1) placedVending1 = true;
            else placedVending2 = true;
            
            // CRITICAL FIX: Do NOT snap to idealX (Math.max). 
            // This was creating huge gaps if currentX was behind idealX.
            // Just place it shortly after the current position.
            const actualX = currentX + 60;

            // Trashcan (Left of vending)
            decorations.push(createDecoration(actualX - 60, floorY, 'trashcan', 1));

            // Vending Machine
            platforms.push({ 
                x: actualX, 
                y: floorY - VENDING_CONFIG.HEIGHT, 
                width: VENDING_CONFIG.WIDTH, 
                height: VENDING_CONFIG.HEIGHT, 
                type: 'vending' 
            });

            // Cooler (Right of vending)
            if (generatorState.canPlaceCooler(actualX)) {
                const coolerX = actualX + VENDING_CONFIG.WIDTH + 60;
                decorations.push(createDecoration(coolerX, floorY, 'cooler'));
                generatorState.registerCooler(coolerX);
                currentX = coolerX + 80;
            } else {
                currentX = actualX + VENDING_CONFIG.WIDTH + 80;
            }
            continue;
        }

        // 2. Pick Biome
        const roll = Math.random();
        if (roll < 0.4) {
            currentX = generateOfficeBiome(platforms, decorations, currentX, floorY);
        } else if (roll < 0.7) {
            currentX = generateLoungeBiome(platforms, decorations, currentX, floorY);
        } else if (roll < 0.9) {
            currentX = generateStorageBiome(platforms, decorations, currentX, floorY);
        } else {
            currentX = generateTransitionBiome(platforms, decorations, currentX, floorY);
        }
    }

    const background = generateBackground(levelLen);

    // STRICT FILTER: Remove any objects that might block the EXIT door (250px buffer)
    const doorSafeZoneX = levelLen - 250;
    
    const finalPlatforms = platforms.filter(p => (p.x + p.width) < doorSafeZoneX);
    const finalDecorations = decorations.filter(d => (d.x + 120) < doorSafeZoneX);

    return { platforms: finalPlatforms, decorations: finalDecorations, background };
};
