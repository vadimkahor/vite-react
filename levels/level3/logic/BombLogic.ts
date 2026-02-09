
import { Level3State, Bomb, Explosion, AshPile } from '../types';
import { LEVEL3_CONFIG } from '../config';
import { stunEnemiesInRadius } from './EnemyLogic';

const BOMB_TIMER = 120; // 2 секунды до взрыва
const BLAST_RADIUS = 1; 
const RECHARGE_TIME = 180; // 3 секунды при 60 FPS (3 * 60)

// Хелпер для случайной фразы (дублируется из EnemyLogic, т.к. модули разделены)
const getRandomPhrase = (list: string[]) => list[Math.floor(Math.random() * list.length)];

/**
 * Попробовать установить бомбу
 */
export const placeBomb = (state: Level3State) => {
    // 1. Проверка наличия зарядов
    if (state.bombCharges <= 0) return;

    const ts = LEVEL3_CONFIG.TILE_SIZE;
    const p = state.player;
    
    // Определяем текущую клетку игрока по центру хитбокса (ставим под собой)
    const col = Math.floor((p.x + LEVEL3_CONFIG.PLAYER_WIDTH / 2) / ts);
    const row = Math.floor((p.y + LEVEL3_CONFIG.PLAYER_HEIGHT / 2) / ts);

    // 2. Проверка валидности клетки (нельзя ставить в стены или препятствия)
    // Проверка границ арены
    if (col < 1 || col >= LEVEL3_CONFIG.COLS - 1 || row < 1 || row >= LEVEL3_CONFIG.ROWS - 1) return;

    const isHardBlock = (row % 2 === 0) && (col % 2 === 0);
    const hasSoftBlock = state.softBlocks.some(sb => sb.col === col && sb.row === row);
    
    if (isHardBlock || hasSoftBlock) return;

    // 3. Проверка: нет ли уже бомбы в этой клетке
    const alreadyHasBomb = state.bombs.some(b => b.col === col && b.row === row);
    if (alreadyHasBomb) return;

    // 4. Тратим заряд и добавляем таймер восстановления
    state.bombCharges--;
    state.rechargeTimers.push(RECHARGE_TIME);

    // ФРАЗА КАТИ ПРИ УСТАНОВКЕ
    if (!state.player.speechBubble || state.player.speechBubble.timer < 30) {
        state.player.speechBubble = {
            text: getRandomPhrase(LEVEL3_CONFIG.KATYA_PHRASES.BOMB),
            timer: 90,
            maxTimer: 90
        };
    }

    state.bombs.push({
        id: Math.random().toString(36).substr(2, 9),
        col,
        row,
        timer: BOMB_TIMER,
        maxTimer: BOMB_TIMER
    });
};

/**
 * Детонация конкретной бомбы
 */
const detonate = (state: Level3State, bomb: Bomb, onGameOver: () => void) => {
    const ts = LEVEL3_CONFIG.TILE_SIZE;
    const explosionCells: {col: number, row: number}[] = [{ col: bomb.col, row: bomb.row }];
    const directions = [
        { dc: 0, dr: -1 }, { dc: 0, dr: 1 },
        { dc: -1, dr: 0 }, { dc: 1, dr: 0 }
    ];

    directions.forEach(dir => {
        for (let i = 1; i <= BLAST_RADIUS; i++) {
            const tc = bomb.col + dir.dc * i;
            const tr = bomb.row + dir.dr * i;

            if (tc < 1 || tc >= LEVEL3_CONFIG.COLS - 1 || tr < 1 || tr >= LEVEL3_CONFIG.ROWS - 1) break;
            
            const isHardBlock = (tr % 2 === 0) && (tc % 2 === 0);
            if (isHardBlock) break;

            explosionCells.push({ col: tc, row: tr });

            const softBlockIdx = state.softBlocks.findIndex(sb => sb.col === tc && sb.row === tr);
            if (softBlockIdx !== -1) {
                state.softBlocks.splice(softBlockIdx, 1);
                break;
            }
            
            const otherBomb = state.bombs.find(b => b.col === tc && b.row === tr);
            if (otherBomb && otherBomb.timer > 2) {
                otherBomb.timer = 2;
            }
        }
    });

    // 1. Проверка: задет ли игрок взрывом
    const px = state.player.x + LEVEL3_CONFIG.PLAYER_WIDTH / 2;
    const py = state.player.y + LEVEL3_CONFIG.PLAYER_HEIGHT / 2;
    const pCol = Math.floor(px / ts);
    const pRow = Math.floor(py / ts);

    if (explosionCells.some(cell => cell.col === pCol && cell.row === pRow)) {
        onGameOver();
    }

    // 2. Уничтожение врагов
    let hasKilled = false;
    const destroyedEnemyIds = new Set<string>();
    for (let i = state.enemies.length - 1; i >= 0; i--) {
        const e = state.enemies[i];
        const ex = e.x + 20; // Центр врага
        const ey = e.y + 25;
        const eCol = Math.floor(ex / ts);
        const eRow = Math.floor(ey / ts);
        
        if (explosionCells.some(cell => cell.col === eCol && cell.row === eRow)) {
            // Создаем пепел и вешаем на него предсмертную фразу
            state.ashPiles.push({
                id: Math.random().toString(),
                col: eCol,
                row: eRow,
                life: 1.0,
                speechBubble: {
                    text: getRandomPhrase(LEVEL3_CONFIG.SUMO_PHRASES.DIE),
                    timer: 120, // 2 секунды висит фраза
                    maxTimer: 120
                }
            });
            destroyedEnemyIds.add(e.id);
            state.enemies.splice(i, 1);
            hasKilled = true;
        }
    }

    // ФРАЗА КАТИ ПРИ УБИЙСТВЕ
    if (hasKilled) {
        state.player.speechBubble = {
            text: getRandomPhrase(LEVEL3_CONFIG.KATYA_PHRASES.KILL),
            timer: 90,
            maxTimer: 90
        };
    }

    // 3. Оглушение выживших врагов в радиусе 3 клеток
    stunEnemiesInRadius(state, bomb.col, bomb.row, 3);

    state.explosions.push({
        id: Math.random().toString(36).substr(2, 9),
        col: bomb.col,
        row: bomb.row,
        life: 1.0,
        cells: explosionCells
    });
};

/**
 * Обновление всех бомб, взрывов и КУЛДАУНОВ
 */
export const updateBombsAndExplosions = (state: Level3State, timeScale: number, onGameOver: () => void) => {
    // 1. Обновление бомб на поле
    for (let i = state.bombs.length - 1; i >= 0; i--) {
        const b = state.bombs[i];
        b.timer -= timeScale;
        if (b.timer <= 0) {
            detonate(state, b, onGameOver);
            state.bombs.splice(i, 1);
        }
    }

    // 2. Обновление взрывов (затухание)
    for (let i = state.explosions.length - 1; i >= 0; i--) {
        const e = state.explosions[i];
        e.life -= 0.02 * timeScale;
        if (e.life <= 0) {
            state.explosions.splice(i, 1);
        }
    }

    // 3. ВОССТАНОВЛЕНИЕ ЗАРЯДОВ
    if (state.bombCharges < state.maxBombCharges) {
        for (let i = state.rechargeTimers.length - 1; i >= 0; i--) {
            state.rechargeTimers[i] -= timeScale;
            if (state.rechargeTimers[i] <= 0) {
                state.bombCharges++;
                state.rechargeTimers.splice(i, 1);
            }
        }
    }
};
