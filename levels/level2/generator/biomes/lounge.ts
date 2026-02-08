
import { Platform, Decoration } from '../../types';
import { createDecoration, getRandomItem } from '../entities';
import { generatorState } from '../state';
import { tryGenerateAirLayer } from '../rules/air-layer';

import { SOFA_CONFIG } from '../../render/Sofa';
import { ARMCHAIR_CONFIG } from '../../render/Armchair';
import { MEETING_TABLE_CONFIG } from '../../render/MeetingTable';
import { BIG_TRASHCAN_CONFIG } from '../../render/BigTrashcan';

export const generateLoungeBiome = (platforms: Platform[], decorations: Decoration[], startX: number, floorY: number): number => {
    let currentX = startX;

    // Sofa/Armchair Group
    if (Math.random() < 0.7) {
        platforms.push({ x: currentX, y: floorY - SOFA_CONFIG.HEIGHT, width: SOFA_CONFIG.WIDTH, height: SOFA_CONFIG.HEIGHT, type: 'sofa' });
        
        tryGenerateAirLayer(platforms, currentX + SOFA_CONFIG.WIDTH/2, floorY, 'mixed');

        if (generatorState.canPlaceClock(currentX + SOFA_CONFIG.WIDTH/2)) {
             const clockX = currentX + SOFA_CONFIG.WIDTH/2;
             decorations.push(createDecoration(clockX, floorY - 220, 'clock'));
             generatorState.registerClock(clockX);
        }
        
        if (Math.random() < 0.5) {
             decorations.push(createDecoration(currentX - 30, floorY, 'floor_lamp'));
        }

        currentX += SOFA_CONFIG.WIDTH + 30; // Reduced gap

        // INCREASED FLOOR PLANT CHANCE: Reduced TV chance from 0.6 to 0.4
        if (Math.random() < 0.4) {
             decorations.push(createDecoration(currentX, floorY, 'tv'));
             tryGenerateAirLayer(platforms, currentX + 60, floorY, 'tier4'); 
             currentX += 130; 
        } else {
             decorations.push(createDecoration(currentX, floorY, 'floor_plant'));
             tryGenerateAirLayer(platforms, currentX, floorY, 'mixed');
             currentX += 60;
        }
    } else {
        if (Math.random() < 0.25) {
            const sections = 2 + Math.floor(Math.random() * 2);
            const bw = sections * BIG_TRASHCAN_CONFIG.SECTION_WIDTH;
            platforms.push({ x: currentX, y: floorY - BIG_TRASHCAN_CONFIG.HEIGHT, width: bw, height: BIG_TRASHCAN_CONFIG.HEIGHT, type: 'big_trashcan' });
            
            tryGenerateAirLayer(platforms, currentX + bw/2, floorY, 'tier3');

            currentX += bw + 60;
        }
    }

    // Meeting Table
    const tableW = getRandomItem([
        MEETING_TABLE_CONFIG.WIDTH, 
        MEETING_TABLE_CONFIG.WIDTH_X2,
        MEETING_TABLE_CONFIG.WIDTH_X3
    ]);
    platforms.push({ x: currentX, y: floorY - MEETING_TABLE_CONFIG.HEIGHT, width: tableW, height: MEETING_TABLE_CONFIG.HEIGHT, type: 'meeting_table' });
    
    tryGenerateAirLayer(platforms, currentX + tableW/2, floorY, 'mixed');
    
    currentX += tableW + 30; // Reduced gap

    // Second item
    const roll = Math.random();
    if (roll < 0.5) { 
        decorations.push(createDecoration(currentX + 5, floorY, 'floor_lamp'));
        currentX += 50;
        platforms.push({ x: currentX, y: floorY - ARMCHAIR_CONFIG.HEIGHT, width: ARMCHAIR_CONFIG.WIDTH, height: ARMCHAIR_CONFIG.HEIGHT, type: 'armchair' });
        
        tryGenerateAirLayer(platforms, currentX + ARMCHAIR_CONFIG.WIDTH/2, floorY, 'mixed');

        currentX += ARMCHAIR_CONFIG.WIDTH;
    } else if (roll < 0.6) {
        decorations.push(createDecoration(currentX, floorY, 'tv'));
        tryGenerateAirLayer(platforms, currentX + 60, floorY, 'tier4');
        currentX += 120;
    } else {
        // INCREASED FLOOR PLANT CHANCE: Even if cooler CAN be placed, sometimes place a plant instead
        const canCooler = generatorState.canPlaceCooler(currentX);
        if (canCooler && Math.random() < 0.6) {
            decorations.push(createDecoration(currentX + 10, floorY, 'cooler'));
            generatorState.registerCooler(currentX);
        } else {
            decorations.push(createDecoration(currentX + 10, floorY, 'floor_plant'));
        }
        
        tryGenerateAirLayer(platforms, currentX + 20, floorY, 'mixed');

        currentX += 60;
    }

    return currentX + 60;
};
