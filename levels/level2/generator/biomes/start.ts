
import { Platform, Decoration } from '../../types';
import { createDecoration } from '../entities';

import { DESK_CONFIG } from '../../render/Desk';
import { BOOK_CABINET_CONFIG } from '../../render/BookCabinet';
import { FILE_CABINET_CONFIG } from '../../render/FileCabinet';

export const generateStartBiome = (platforms: Platform[], decorations: Decoration[], startX: number, floorY: number): number => {
    let currentX = startX;

    // 1. TRASHCAN SILVER (Variant 3)
    decorations.push(createDecoration(currentX, floorY, 'trashcan', 3));
    currentX += 80; // Gap to desk

    // 2. DESK with Computer and Large Papers
    const dh = DESK_CONFIG.HEIGHT;
    const dw = DESK_CONFIG.WIDTH;
    
    platforms.push({ x: currentX, y: floorY - dh, width: dw, height: dh, type: 'desk' });
    
    // Decor on desk
    decorations.push(createDecoration(currentX + 25, floorY - dh, 'computer', 0)); // PC
    decorations.push(createDecoration(currentX + 80, floorY - dh, 'papers', 2));   // Large Stack of Papers (Variant 2)

    currentX += dw + 40; // Gap to next item

    // 3. BOOK CABINET
    const bookW = BOOK_CABINET_CONFIG.BASE_WIDTH;
    const bookH = BOOK_CABINET_CONFIG.HEIGHT;
    platforms.push({ x: currentX, y: floorY - bookH, width: bookW, height: bookH, type: 'book_cabinet' });
    
    currentX += bookW + 60; // Gap to cooler

    // 4. COOLER
    decorations.push(createDecoration(currentX, floorY, 'cooler', 0));
    
    currentX += 60 + 40; // Cooler width approx 60 + Gap

    // 5. CABINET (File Cabinet)
    const cabW = FILE_CABINET_CONFIG.WIDTH;
    const cabH = FILE_CABINET_CONFIG.HEIGHT;
    platforms.push({ x: currentX, y: floorY - cabH, width: cabW, height: cabH, type: 'file_cabinet' });

    currentX += cabW;

    return currentX;
};
