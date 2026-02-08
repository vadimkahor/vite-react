
import { Decoration } from '../types';

export const getRandomItem = <T,>(arr: T[] | readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const createDecoration = (x: number, y: number, type: Decoration['type'], variant?: number): Decoration => {
    let v = variant !== undefined ? variant : 0;
    if (variant === undefined) {
        if (type === 'papers') v = Math.floor(Math.random() * 4);
        else if (type === 'plant') v = Math.floor(Math.random() * 3);
        else if (type === 'floor_plant') v = Math.floor(Math.random() * 4); 
        else if (type === 'computer') v = Math.floor(Math.random() * 3);
        else if (type === 'trashcan') v = Math.random() > 0.5 ? 1 : 3;
        else if (type === 'clock') v = Math.floor(Math.random() * 12);
        else if (type === 'desk_lamp') v = 0; 
        else if (type === 'floor_lamp') v = 0; 
        else if (type === 'tv') v = 0;
        else if (type === 'boxes') v = 0;
    }
    return { x, y, type, variant: v };
};
