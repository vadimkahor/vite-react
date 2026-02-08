
import { BackgroundElement, Building } from '../types';

export const generateBackground = (levelLength: number): BackgroundElement[] => {
    const elements: BackgroundElement[] = [];
    const windowSpacing = 400;
    const count = Math.ceil(levelLength / windowSpacing) + 2;

    for (let i = 0; i < count; i++) {
        const wx = i * windowSpacing + 100;
        const wy = 100;
        const ww = 150;
        const wh = 200;
        
        const buildings: Building[] = [];
        let localX = 0;
        while (localX < ww) {
            localX += 10 + (Math.random() * 20);
            if (localX >= ww) break;
            const bWidth = 40 + (Math.random() * 50);
            const bHeight = 50 + (Math.random() * 140);
            const litWindows: boolean[][] = [];
            const litProb = Math.random() < 0.5 ? 0.2 : 0.8;
            for (let winY = 10; winY < bHeight - 5; winY += 16) {
                const row: boolean[] = [];
                for (let winX = 6; winX < bWidth - 6; winX += 10) row.push(Math.random() < litProb);
                litWindows.push(row);
            }
            buildings.push({ x: localX, width: bWidth, height: bHeight, litWindows });
            localX += bWidth;
        }
        elements.push({ x: wx, y: wy, width: ww, height: wh, hasClouds: Math.random() < 0.4, cloudSeed: Math.random(), buildings });
    }
    return elements;
};
