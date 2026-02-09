
import { Level3State, Enemy, AshPile } from '../types';
import { LEVEL3_CONFIG } from '../config';

const SIGHT_RANGE = 3;
const STUN_DURATION = 120; // 2 секунды

// Хелпер для случайной фразы
const getRandomPhrase = (list: string[]) => list[Math.floor(Math.random() * list.length)];

/**
 * Проверяет, свободна ли клетка для движения врага
 */
const isCellPassable = (state: Level3State, col: number, row: number) => {
    if (col < 1 || col >= LEVEL3_CONFIG.COLS - 1 || row < 1 || row >= LEVEL3_CONFIG.ROWS - 1) return false;
    
    // Твердые блоки (столы)
    if (row % 2 === 0 && col % 2 === 0) return false;

    // Мягкие блоки (перегородки)
    if (state.softBlocks.some(sb => sb.col === col && sb.row === row)) return false;

    // Бомбы
    if (state.bombs.some(b => b.col === col && b.row === row)) return false;

    return true;
};

/**
 * Логика обновления всех противников на уровне
 */
export const updateEnemies = (state: Level3State, timeScale: number, onGameOver: () => void) => {
    const ts = LEVEL3_CONFIG.TILE_SIZE;
    const px = state.player.x + LEVEL3_CONFIG.PLAYER_WIDTH / 2;
    const py = state.player.y + LEVEL3_CONFIG.PLAYER_HEIGHT / 2;
    const pCol = Math.floor(px / ts);
    const pRow = Math.floor(py / ts);

    state.enemies.forEach(enemy => {
        // Обновление таймера реплики
        if (enemy.speechBubble) {
            enemy.speechBubble.timer -= timeScale;
            if (enemy.speechBubble.timer <= 0) enemy.speechBubble = undefined;
        }

        if (enemy.state === 'stunned') {
            enemy.stunTimer -= timeScale;
            if (enemy.stunTimer <= 0) {
                enemy.state = 'patrol';
            }
            return;
        }

        enemy.frame += timeScale;
        const ex = enemy.x + 20; // Центр врага (затычка 40x50)
        const ey = enemy.y + 25;
        const col = Math.floor(ex / ts);
        const row = Math.floor(ey / ts);

        // 1. Проверка столкновения с игроком
        const distToPlayer = Math.sqrt(Math.pow(ex - px, 2) + Math.pow(ey - py, 2));
        
        // ВАЖНО: Игрок может проходить сквозь оглушенных врагов (если не оглушен - проигрыш)
        if (distToPlayer < 35) {
            onGameOver();
        }

        // 2. Зона видимости (3 клетки по прямой)
        let canSeePlayer = false;
        if (col === pCol && Math.abs(row - pRow) <= SIGHT_RANGE) {
            // Проверка препятствий по вертикали
            const step = Math.sign(pRow - row);
            let blocked = false;
            for (let r = row + (step > 0 ? 1 : -1); r !== pRow; r += step) {
                if (!isCellPassable(state, col, r)) { blocked = true; break; }
            }
            if (!blocked) {
                canSeePlayer = true;
                
                // Если только что увидел игрока, кричим фразу
                if (enemy.state !== 'chase') {
                    enemy.dir = step > 0 ? 'down' : 'up'; // Предварительный поворот
                    // 30% шанс крикнуть при обнаружении
                    if (Math.random() < 0.3 && !enemy.speechBubble) {
                        enemy.speechBubble = {
                            text: getRandomPhrase(LEVEL3_CONFIG.SUMO_PHRASES.CHASE),
                            timer: 90,
                            maxTimer: 90
                        };
                    }
                }
                enemy.state = 'chase';
                enemy.dir = step > 0 ? 'down' : 'up';
            }
        } else if (row === pRow && Math.abs(col - pCol) <= SIGHT_RANGE) {
            // Проверка препятствий по горизонтали
            const step = Math.sign(pCol - col);
            let blocked = false;
            for (let c = col + (step > 0 ? 1 : -1); c !== pCol; c += step) {
                if (!isCellPassable(state, c, row)) { blocked = true; break; }
            }
            if (!blocked) {
                canSeePlayer = true;
                
                // Если только что увидел игрока
                if (enemy.state !== 'chase') {
                    enemy.dir = step > 0 ? 'right' : 'left';
                    if (Math.random() < 0.3 && !enemy.speechBubble) {
                        enemy.speechBubble = {
                            text: getRandomPhrase(LEVEL3_CONFIG.SUMO_PHRASES.CHASE),
                            timer: 90,
                            maxTimer: 90
                        };
                    }
                }
                enemy.state = 'chase';
                enemy.dir = step > 0 ? 'right' : 'left';
            }
        }

        if (!canSeePlayer && enemy.state === 'chase') {
            enemy.state = 'patrol';
        }

        // 3. Движение и Выравнивание (Строго по сетке, без диагоналей)
        const moveSpeed = (enemy.state === 'chase' ? enemy.speed * 1.3 : enemy.speed) * timeScale;
        const alignSpeed = 2.5 * timeScale;

        // Строгое выравнивание по осям для имитации движения по рельсам
        if (enemy.dir === 'left' || enemy.dir === 'right') {
            // Выравниваем по Y
            const targetY = row * ts + (ts - 50) / 2;
            const diffY = targetY - enemy.y;
            if (Math.abs(diffY) > 0.1) {
                enemy.y += Math.sign(diffY) * Math.min(Math.abs(diffY), alignSpeed);
            }
        } else {
            // Выравниваем по X
            const targetX = col * ts + (ts - 40) / 2;
            const diffX = targetX - enemy.x;
            if (Math.abs(diffX) > 0.1) {
                enemy.x += Math.sign(diffX) * Math.min(Math.abs(diffX), alignSpeed);
            }
        }

        let dx = 0, dy = 0;
        if (enemy.dir === 'left') dx = -moveSpeed;
        else if (enemy.dir === 'right') dx = moveSpeed;
        else if (enemy.dir === 'up') dy = -moveSpeed;
        else if (enemy.dir === 'down') dy = moveSpeed;

        const nextEx = enemy.x + dx;
        const nextEy = enemy.y + dy;
        // Проверяем коллизию с учетом хитбокса врага
        const checkCol = Math.floor((nextEx + 20 + Math.sign(dx) * 15) / ts);
        const checkRow = Math.floor((nextEy + 25 + Math.sign(dy) * 20) / ts);

        if (isCellPassable(state, checkCol, checkRow)) {
            enemy.x = nextEx;
            enemy.y = nextEy;
        } else {
            // Смена направления при столкновении или потере игрока
            const dirs: Array<'up' | 'down' | 'left' | 'right'> = ['up', 'down', 'left', 'right'];
            const validDirs = dirs.filter(d => {
                let tc = col, tr = row;
                if (d === 'left') tc--; else if (d === 'right') tc++; else if (d === 'up') tr--; else if (d === 'down') tr++;
                return isCellPassable(state, tc, tr);
            });
            if (validDirs.length > 0) {
                enemy.dir = validDirs[Math.floor(Math.random() * validDirs.length)];
            }
            enemy.state = 'patrol';
        }
    });

    // Обновление пепла
    for (let i = state.ashPiles.length - 1; i >= 0; i--) {
        const ash = state.ashPiles[i];
        ash.life -= 0.01 * timeScale;
        if (ash.speechBubble) {
            ash.speechBubble.timer -= timeScale;
            if (ash.speechBubble.timer <= 0) ash.speechBubble = undefined;
        }
        if (ash.life <= 0) state.ashPiles.splice(i, 1);
    }
};

/**
 * Создает новых противников в комнате
 */
export const spawnEnemiesForRoom = (state: Level3State) => {
    // Количество противников теперь строго 3 в любой комнате
    const count = 3;
    const ts = LEVEL3_CONFIG.TILE_SIZE;
    
    // Получаем текущие координаты игрока в сетке
    const px = state.player.x + LEVEL3_CONFIG.PLAYER_WIDTH / 2;
    const py = state.player.y + LEVEL3_CONFIG.PLAYER_HEIGHT / 2;
    const pCol = Math.floor(px / ts);
    const pRow = Math.floor(py / ts);

    state.enemies = [];
    state.ashPiles = [];

    let attempts = 0;
    while (state.enemies.length < count && attempts < 1000) {
        attempts++;
        const c = 1 + Math.floor(Math.random() * (LEVEL3_CONFIG.COLS - 2));
        const r = 1 + Math.floor(Math.random() * (LEVEL3_CONFIG.ROWS - 2));

        // 1. Не в твердом блоке (столе)
        if (c % 2 === 0 && r % 2 === 0) continue;
        
        // 2. Не в мягком блоке (перегородке)
        if (state.softBlocks.some(sb => sb.col === c && sb.row === r)) continue;
        
        // 3. Не в клетке с уже существующей бомбой
        if (state.bombs.some(b => b.col === c && b.row === r)) continue;

        // 4. ПРОВЕРКА ДИСТАНЦИИ ОТ ИГРОКА (Радиус 5 клеток)
        const distToPlayer = Math.sqrt(Math.pow(c - pCol, 2) + Math.pow(r - pRow, 2));
        if (distToPlayer < 5) continue;

        // 5. ПРОВЕРКА ДИСТАНЦИИ ОТ ДРУГИХ ВРАГОВ (Чтобы не было "кучи")
        // Минимум 4 клетки между врагами
        const isTooCloseToOtherEnemy = state.enemies.some(e => {
            const ec = Math.floor((e.x + 20) / ts);
            const er = Math.floor((e.y + 25) / ts);
            const dist = Math.sqrt(Math.pow(c - ec, 2) + Math.pow(r - er, 2));
            return dist < 4;
        });
        if (isTooCloseToOtherEnemy) continue;

        const newEnemy: Enemy = {
            id: Math.random().toString(36).substr(2, 9),
            x: c * ts + (ts - 40) / 2,
            y: r * ts + (ts - 50) / 2,
            type: 'waiter',
            dir: Math.random() > 0.5 ? 'down' : 'right',
            state: 'patrol',
            speed: 1.5,
            frame: Math.random() * 100,
            stunTimer: 0,
            lastMoveTimer: 0
        };
        state.enemies.push(newEnemy);
    }
};

export const stunEnemiesInRadius = (state: Level3State, col: number, row: number, radius: number) => {
    let hasStunnedSomeone = false;
    state.enemies.forEach(enemy => {
        const ts = LEVEL3_CONFIG.TILE_SIZE;
        const eCol = Math.floor((enemy.x + 20) / ts);
        const eRow = Math.floor((enemy.y + 25) / ts);
        const dist = Math.sqrt(Math.pow(eCol - col, 2) + Math.pow(eRow - row, 2));
        if (dist <= radius) {
            // Если враг еще не был оглушен, даем реплику
            if (enemy.state !== 'stunned') {
                enemy.speechBubble = {
                    text: getRandomPhrase(LEVEL3_CONFIG.SUMO_PHRASES.STUN),
                    timer: 90,
                    maxTimer: 90
                };
                hasStunnedSomeone = true;
            }
            enemy.state = 'stunned';
            enemy.stunTimer = STUN_DURATION;
        }
    });

    // ФРАЗА КАТИ ПРИ ОГЛУШЕНИИ
    if (hasStunnedSomeone) {
        state.player.speechBubble = {
            text: getRandomPhrase(LEVEL3_CONFIG.KATYA_PHRASES.STUN),
            timer: 90,
            maxTimer: 90
        };
    }
};
