
// @ts-ignore
import * as ROT from 'rot-js';
import { LEVEL3_CONFIG } from '../config';
import { SoftBlock, Door } from '../types';

export const generateLevelMap = (forcedEntry?: Door, isLastRoom: boolean = false): { softBlocks: SoftBlock[], doors: Door[], cakePos?: {col: number, row: number} } => {
    const { ROWS, COLS } = LEVEL3_CONFIG;
    const softBlocks: SoftBlock[] = [];
    const doors: Door[] = [];
    let cakePos: {col: number, row: number} | undefined = undefined;
    
    const mapData: number[][] = Array(ROWS).fill(0).map(() => Array(COLS).fill(0));

    // 1. БАЗОВАЯ ГЕНЕРАЦИЯ (Divided Maze)
    const maze = new ROT.Map.DividedMaze(COLS, ROWS);
    maze.create((x: number, y: number, value: number) => {
        if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
            mapData[y][x] = value;
        }
    });

    // 2. ГЕНЕРАЦИЯ ДВЕРЕЙ
    const entry: Door = forcedEntry ? { ...forcedEntry, type: 'entry' } : { col: 0, row: 1, side: 'left', type: 'entry' };
    doors.push(entry);
    
    // Очищаем зону вокруг входа (увеличена зона безопасности)
    if (entry.side === 'left') for (let c = 1; c <= 4; c++) mapData[entry.row][c] = 0;
    else if (entry.side === 'right') for (let c = COLS - 2; c >= COLS - 5; c--) mapData[entry.row][c] = 0;
    else if (entry.side === 'top') for (let r = 1; r <= 4; r++) mapData[r][entry.col] = 0;
    else if (entry.side === 'bottom') for (let r = ROWS - 2; r >= ROWS - 5; r--) mapData[r][entry.col] = 0;

    // Сбор кандидатов для выхода или торта
    if (!isLastRoom) {
        const exitCandidates: Door[] = [];
        const isFarEnough = (c: number, r: number) => {
            const dist = Math.sqrt(Math.pow(c - entry.col, 2) + Math.pow(r - entry.row, 2));
            return dist > 8;
        };

        if (!forcedEntry) {
            // ПЕРВАЯ КОМНАТА: Ограничиваем только правым нижним углом (как на скриншоте)
            for (let r = Math.floor(ROWS / 2); r < ROWS - 1; r++) {
                if (isFarEnough(COLS - 1, r)) exitCandidates.push({ col: COLS - 1, row: r, side: 'right', type: 'exit' });
            }
            for (let c = Math.floor(COLS / 2); c < COLS - 1; c++) {
                if (isFarEnough(c, ROWS - 1)) exitCandidates.push({ col: c, row: ROWS - 1, side: 'bottom', type: 'exit' });
            }
        } else {
            for (let r = 1; r < ROWS - 1; r++) {
                if (isFarEnough(COLS - 1, r)) exitCandidates.push({ col: COLS - 1, row: r, side: 'right', type: 'exit' });
                if (isFarEnough(0, r)) exitCandidates.push({ col: 0, row: r, side: 'left', type: 'exit' });
            }
            for (let c = 1; c < COLS - 1; c++) {
                const isMirrorOfHUD = c >= 6 && c <= 10;
                if (isFarEnough(c, ROWS - 1) && !isMirrorOfHUD) exitCandidates.push({ col: c, row: ROWS - 1, side: 'bottom', type: 'exit' });
                if (isFarEnough(c, 0) && !isMirrorOfHUD) exitCandidates.push({ col: c, row: 0, side: 'top', type: 'exit' });
            }
        }

        const exitDoor = exitCandidates[Math.floor(Math.random() * exitCandidates.length)] || { col: COLS - 1, row: ROWS - 2, side: 'right', type: 'exit' };
        doors.push(exitDoor);

        // Очищаем путь к выходу (2 клетки вглубь), чтобы перегородки не блокировали его
        if (exitDoor.side === 'right') { mapData[exitDoor.row][exitDoor.col - 1] = 0; mapData[exitDoor.row][exitDoor.col - 2] = 0; }
        else if (exitDoor.side === 'left') { mapData[exitDoor.row][exitDoor.col + 1] = 0; mapData[exitDoor.row][exitDoor.col + 2] = 0; }
        else if (exitDoor.side === 'bottom') { mapData[exitDoor.row - 1][exitDoor.col] = 0; mapData[exitDoor.row - 2][exitDoor.col] = 0; }
        else if (exitDoor.side === 'top') { mapData[exitDoor.row + 1][exitDoor.col] = 0; mapData[exitDoor.row + 2][exitDoor.col] = 0; }
    } else {
        let maxDist = -1;
        for (let r = 2; r < ROWS - 1; r += 2) {
            for (let c = 2; c < COLS - 1; c += 2) {
                const dist = Math.pow(c - entry.col, 2) + Math.pow(r - entry.row, 2);
                if (dist > maxDist) {
                    maxDist = dist;
                    cakePos = { col: c, row: r };
                }
            }
        }
    }

    // 3. АЛГОРИТМ "СКАНЕР"
    for (let r = 1; r < ROWS - 1; r += 2) {
        let emptyRun = 0;
        let limit = 4 + Math.floor(Math.random() * 3);
        for (let c = 1; c < COLS - 1; c++) {
            if (mapData[r][c] === 0) {
                emptyRun++;
                if (emptyRun >= limit && c % 2 === 0) {
                    const nearEntry = Math.abs(c - entry.col) < 3 && Math.abs(r - entry.row) < 3;
                    const isNearAnyDoor = doors.some(d => Math.abs(c - d.col) < 2 && Math.abs(r - d.row) < 2);
                    const nearCake = cakePos ? (Math.abs(c - cakePos.col) < 2 && Math.abs(r - cakePos.row) < 2) : false;
                    
                    if (!nearEntry && !isNearAnyDoor && !nearCake) {
                        mapData[r][c] = 1;
                        emptyRun = 0;
                        limit = 4 + Math.floor(Math.random() * 3);
                    }
                }
            } else { emptyRun = 0; }
        }
    }

    // 4. КОНВЕРТАЦИЯ В SOFT BLOCKS
    for (let r = 1; r < ROWS - 1; r++) {
        for (let c = 1; c < COLS - 1; c++) {
            if (mapData[r][c] === 1) {
                // Дополнительная проверка: не ставить перегородку в клетку, смежную с дверью
                const blocksDoor = doors.some(d => (Math.abs(c - d.col) + Math.abs(r - d.row)) <= 1);
                if (blocksDoor) continue;

                const isHardBlockPos = (r % 2 === 0) && (c % 2 === 0);
                if (isHardBlockPos) continue;
                
                const isVerticalBridge = (r % 2 !== 0 && c % 2 === 0); 
                const isHorizontalBridge = (r % 2 === 0 && c % 2 !== 0); 
                
                if (isVerticalBridge) softBlocks.push({ col: c, row: r, axis: 'v' });
                else if (isHorizontalBridge) softBlocks.push({ col: c, row: r, axis: 'h' });
            }
        }
    }

    return { softBlocks, doors, cakePos };
};
