
import { Platform } from '../../types';
import { generatorState } from '../state';
import { getRandomItem } from '../entities';

// Configs
import { AIR_CONDITIONER_CONFIG } from '../../render/AirConditioner';
import { ELECTRIC_BOX_CONFIG } from '../../render/ElectricBox';
import { PLATFORM_CONFIG } from '../../render/Platform';

/**
 * Пытается сгенерировать "воздушный" слой (Tier 3 или Tier 4) над объектом или промежутком.
 * @param platforms Массив платформ для добавления
 * @param centerX Центр объекта/промежутка, над которым генерируем
 * @param floorY Координата пола
 * @param preferTier Preference for tier (default mixed)
 */
export const tryGenerateAirLayer = (
    platforms: Platform[], 
    centerX: number, 
    floorY: number,
    preferTier: 'tier3' | 'tier4' | 'mixed' = 'mixed'
) => {
    const tierRoll = Math.random();
    
    // Logic: Tier 3 (-260px) or Tier 4 (-360px)
    
    const isTier3 = preferTier === 'tier3' || (preferTier === 'mixed' && tierRoll < 0.6);

    let airW = 0;
    let airH = 0;
    let airType: Platform['type'];
    let airY = 0;

    if (isTier3) {
        // --- TIER 3 GENERATION (-260px) ---
        // Candidates: AC, E-Box, Small Platform (Shelf moved to Tier 2)
        const candidates: ('air_conditioner' | 'electric_box' | 'platform')[] = ['platform'];
        
        if (generatorState.canPlaceAc(centerX)) candidates.push('air_conditioner');
        if (generatorState.canPlaceEbox(centerX)) candidates.push('electric_box');

        airType = getRandomItem(candidates);

        if (airType === 'air_conditioner') { airW = AIR_CONDITIONER_CONFIG.WIDTH; airH = AIR_CONDITIONER_CONFIG.HEIGHT; }
        else if (airType === 'electric_box') { airW = ELECTRIC_BOX_CONFIG.WIDTH; airH = ELECTRIC_BOX_CONFIG.HEIGHT; }
        else { airW = PLATFORM_CONFIG.WIDTH; airH = PLATFORM_CONFIG.HEIGHT; }

        airY = floorY - 260; // STRICTLY TIER 3
    } else {
        // --- TIER 4 GENERATION (-360px) ---
        // Candidates: ONLY Platforms (Medium or Large)
        const isLarge = Math.random() < 0.4;
        airW = isLarge ? PLATFORM_CONFIG.LARGE_WIDTH : PLATFORM_CONFIG.MEDIUM_WIDTH;
        airH = PLATFORM_CONFIG.HEIGHT;
        airType = 'platform';
        
        airY = floorY - 360; // STRICTLY TIER 4
    }

    const proposedX = centerX - airW / 2;

    // --- COLLISION CHECK ---
    // Проверяем, не накладывается ли новая платформа на уже существующие на том же ярусе.
    // Это предотвращает создание "супер-длинных" платформ и визуальных глитчей.
    const buffer = 10; // Минимальное расстояние между платформами
    const hasOverlap = platforms.some(p => {
        // Проверяем только платформы на примерно той же высоте (допуск 10px)
        if (Math.abs(p.y - airY) > 10) return false;

        // Проверка пересечения прямоугольников по оси X с учетом буфера
        const pLeft = p.x;
        const pRight = p.x + p.width;
        const newLeft = proposedX;
        const newRight = proposedX + airW;

        // Пересекаются, если один начинается до того, как заканчивается другой (+ buffer)
        return (newLeft < pRight + buffer) && (newRight + buffer > pLeft);
    });

    // Если обнаружено наслоение, отменяем генерацию
    if (hasOverlap) return;

    // Добавляем платформу
    platforms.push({ x: proposedX, y: airY, width: airW, height: airH, type: airType });
        
    // Обновляем трекеры (только если успешно добавили)
    if (isTier3) {
        if (airType === 'air_conditioner') generatorState.registerAc(centerX);
        if (airType === 'electric_box') generatorState.registerEbox(centerX);
    }
};
