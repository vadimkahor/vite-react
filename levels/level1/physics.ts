
import { LEVEL1_CONFIG } from './config';
import { GameRefs } from './types';
import { getNextPhrase, addFloatingMessage } from './utils';

/**
 * Хелпер для спауна частиц через Object Pool (без new Object)
 */
const spawnParticle = (
    refs: GameRefs, 
    x: number, 
    y: number, 
    vx: number, 
    vy: number, 
    size: number, 
    life: number
) => {
    // Ищем первую неактивную частицу
    for (let i = 0; i < refs.particles.length; i++) {
        if (!refs.particles[i].active) {
            const p = refs.particles[i];
            p.active = true;
            p.x = x;
            p.y = y;
            p.vx = vx;
            p.vy = vy;
            p.size = size;
            p.life = life;
            p.id = Math.random().toString(); // Можно убрать если id не критичен
            return;
        }
    }
};

/**
 * Логика появления новых машин трафика.
 */
const spawnTraffic = (refs: GameRefs, timeScale: number) => {
  if (refs.trafficSpawnDelay > 0 || refs.isOutro) {
      refs.trafficSpawnDelay -= timeScale;
      return; 
  }

  const activeTrafficCount = refs.traffic.length;
  if (activeTrafficCount >= LEVEL1_CONFIG.MAX_TRAFFIC_COUNT) return;
  
  const spawnRateMultiplier = activeTrafficCount < LEVEL1_CONFIG.MIN_TRAFFIC_COUNT ? 4.0 : 1.0;
  refs.spawnTimer -= (timeScale * spawnRateMultiplier);

  if (refs.spawnTimer <= 0) {
    const currentSpeed = refs.gameState.playerSpeed;
    const speedRatio = currentSpeed / LEVEL1_CONFIG.MAX_SPEED; 
    const baseDelay = 50 - (speedRatio * 30); 
    const randomDelay = Math.random() * 15; 
    const spawnY = -250;
    
    const lanes = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5);
    let spawned = false;

    for (let i = 0; i < lanes.length; i++) {
      const lane = lanes[i];
      const x = (lane * LEVEL1_CONFIG.LANE_WIDTH) + (LEVEL1_CONFIG.LANE_WIDTH / 2) - (LEVEL1_CONFIG.TRAFFIC_WIDTH / 2);
      const laneGap = LEVEL1_CONFIG.MIN_SPAWN_GAP + (Math.random() * 50);
      
      let isLaneBlocked = false;
      let carsAtSpawnLevel = 0;

      for (let j = 0; j < refs.traffic.length; j++) {
        const t = refs.traffic[j];
        const distY = Math.abs(t.y - spawnY);

        if (distY < 100) {
          carsAtSpawnLevel++;
        }

        if (!isLaneBlocked) {
          const isSameLane = Math.abs(t.x - x) < 10;
          if (isSameLane && distY < laneGap) {
            isLaneBlocked = true;
          }
        }
      }

      if (!isLaneBlocked && carsAtSpawnLevel < 2) {
        const trafficGlobalSpeed = refs.gameState.baseTrafficSpeed + (Math.random() * 6);
        refs.traffic.push({
          id: Math.random().toString(),
          x,
          y: spawnY,
          width: LEVEL1_CONFIG.TRAFFIC_WIDTH,
          height: LEVEL1_CONFIG.TRAFFIC_HEIGHT,
          speed: trafficGlobalSpeed,
          color: LEVEL1_CONFIG.COLORS.TRAFFIC[Math.floor(Math.random() * LEVEL1_CONFIG.COLORS.TRAFFIC.length)],
          type: 'traffic'
        });
        spawned = true;
        refs.lastSpawnedLane = lane;
        break; 
      }
    }

    if (spawned) {
      if (refs.traffic.length < LEVEL1_CONFIG.MIN_TRAFFIC_COUNT) {
          refs.spawnTimer = 10 + Math.random() * 10;
      } else {
          refs.spawnTimer = baseDelay + randomDelay;
      }
    } else {
      refs.spawnTimer = 5; 
    }
  }
};

/**
 * Основная функция обновления.
 */
export const updateGame = (
  refs: GameRefs, 
  timeScale: number, 
  onGameOver: (score: number) => void,
  onComplete: (score: number, time: number) => void
): boolean => {
  const canvas = refs.canvas;
  const p = refs.player;
  const keys = refs.keys;

  // --- ЛОГИКА ИНТРО ---
  if (refs.isIntro) {
    refs.roadOffset = (refs.roadOffset + (LEVEL1_CONFIG.INITIAL_SPEED * timeScale)) % 100;
    refs.environmentOffset = (refs.environmentOffset + (LEVEL1_CONFIG.INITIAL_SPEED * timeScale));
    
    const targetOffset = 260; 
    refs.cameraOffset += (targetOffset - refs.cameraOffset) * 0.04 * timeScale;
    p.y = canvas.height - refs.cameraOffset;

    const targetX = (LEVEL1_CONFIG.ROAD_WIDTH / 2) - (LEVEL1_CONFIG.PLAYER_WIDTH / 2);
    p.x += (targetX - p.x) * 0.1 * timeScale;
    refs.playerVelocityX = 0;
    refs.engineIntensity = 1.0; 

    return true; 
  }

  // --- ОБЩАЯ ПОДГОТОВКА СКОРОСТИ ---
  const STANDARD_OUTRO_SPEED = 10;
  const SPEED_SMOOTHING = 0.05;

  // Стабилизация скорости игрока в аутро
  if (refs.isOutro) {
    refs.gameState.playerSpeed += (STANDARD_OUTRO_SPEED - refs.gameState.playerSpeed) * SPEED_SMOOTHING * timeScale;
  }

  // --- ОБЫЧНАЯ ЛОГИКА ИГРЫ + АУТРО ---
  
  // Обновление времени
  refs.timeElapsed += timeScale / 60;

  // 1. Полосы
  const newLane = Math.floor((p.x + p.width / 2) / LEVEL1_CONFIG.LANE_WIDTH);
  if (newLane === refs.playerCurrentLane) {
      refs.laneStabilityTimer += timeScale;
  } else {
      refs.playerCurrentLane = newLane;
      refs.laneStabilityTimer = 0;
  }

  // 2. Управление скоростью и Бернаут
  // Блокируем ввод если аутро
  const isBraking = !refs.isOutro && keys.has('ArrowDown');
  const isAccelerating = !refs.isOutro && keys.has('ArrowUp');

  // Логика запуска Burnout
  if (isAccelerating && refs.gameState.playerSpeed < LEVEL1_CONFIG.MIN_SPEED + 1 && refs.burnoutTimer <= 0) {
       refs.burnoutTimer = 40; 
  }
  
  if (refs.burnoutTimer > 0) {
      refs.burnoutTimer -= timeScale;
      if (Math.random() < 0.8 * timeScale) {
        const axles = [15, p.height - 5]; 
        for (let i = 0; i < axles.length; i++) {
            const yOffset = axles[i];
            const isLeft = Math.random() > 0.5;
            spawnParticle(refs, (isLeft ? p.x : p.x + p.width) + (Math.random() * 14 - 7), p.y + yOffset, (Math.random() - 0.5) * 6, (Math.random() * 2) + 2, 5 + Math.random() * 6, 1.0);
        }
        if (Math.random() > 0.5) {
             const tireOffset = 6; const tireWidth = 6;
             refs.skidMarks.push({ id: Math.random().toString(), x: Math.random() > 0.5 ? p.x + tireOffset : p.x + p.width - tireOffset - tireWidth, y: p.y + p.height - 5, width: tireWidth, height: 5 * timeScale, opacity: 0.5 });
        }
      }
  }

  if (isAccelerating) {
    refs.gameState.playerSpeed = Math.min(LEVEL1_CONFIG.MAX_SPEED, refs.gameState.playerSpeed + (LEVEL1_CONFIG.ACCELERATION * timeScale));
    refs.brakingDuration = 0;
  } else if (isBraking) {
    refs.brakingDuration += timeScale;
    let brakeForce = LEVEL1_CONFIG.BRAKING;
    if (refs.gameState.playerSpeed > LEVEL1_CONFIG.INITIAL_SPEED) brakeForce *= LEVEL1_CONFIG.HIGH_SPEED_BRAKING_MULT;
    refs.gameState.playerSpeed = Math.max(LEVEL1_CONFIG.MIN_SPEED, refs.gameState.playerSpeed - (brakeForce * timeScale));

    if (refs.gameState.playerSpeed > 2) {
        const tireOffset = 6; const tireWidth = 6; const markHeight = 20 * timeScale; const opacity = 0.15 + Math.random() * 0.2; 
        refs.skidMarks.push({ id: Math.random().toString(), x: p.x + tireOffset, y: p.y + p.height - 15, width: tireWidth, height: markHeight, opacity: opacity });
        refs.skidMarks.push({ id: Math.random().toString(), x: p.x + p.width - tireOffset - tireWidth, y: p.y + p.height - 15, width: tireWidth, height: markHeight, opacity: opacity });
    }
    if (refs.brakingDuration > 15) {
        const spawnChance = 0.6 * timeScale; const axles = [15, p.height - 5]; 
        for (let i = 0; i < axles.length; i++) {
            if (Math.random() < spawnChance) {
                const isLeft = Math.random() > 0.5;
                spawnParticle(refs, (isLeft ? p.x : p.x + p.width) + (Math.random() * 10 - 5), p.y + axles[i], (Math.random() - 0.5) * 3, (Math.random() * 2), 3 + Math.random() * 4, 0.8);
            }
        }
    }
  } else if (!refs.isOutro) {
    refs.brakingDuration = 0;
    // Трение
    if (refs.gameState.playerSpeed > LEVEL1_CONFIG.INITIAL_SPEED) {
        refs.gameState.playerSpeed = Math.max(LEVEL1_CONFIG.INITIAL_SPEED, refs.gameState.playerSpeed - (LEVEL1_CONFIG.FRICTION * timeScale));
    } else if (refs.gameState.playerSpeed < LEVEL1_CONFIG.INITIAL_SPEED) {
        refs.gameState.playerSpeed = Math.min(LEVEL1_CONFIG.INITIAL_SPEED, refs.gameState.playerSpeed + (LEVEL1_CONFIG.FRICTION * timeScale));
    }
  }

  const currentSpeed = refs.gameState.playerSpeed;

  // Обновление skidMarks
  for (let i = refs.skidMarks.length - 1; i >= 0; i--) {
      const m = refs.skidMarks[i];
      m.y += (currentSpeed * timeScale);
      m.opacity -= 0.005 * timeScale;
      if (m.y >= canvas.height + 100 || m.opacity <= 0) refs.skidMarks.splice(i, 1);
  }

  // Обновление particles
  for (let i = 0; i < refs.particles.length; i++) {
      const pt = refs.particles[i];
      if (!pt.active) continue;
      pt.x += pt.vx * timeScale;
      pt.y += pt.vy * timeScale + (currentSpeed * 0.9 * timeScale);
      pt.size += 0.3 * timeScale;
      pt.life -= 0.04 * timeScale;
      if (pt.life <= 0) pt.active = false;
  }

  // 3. Тряска
  if (currentSpeed > 10) {
    const shakeProgress = (currentSpeed - 10) / (LEVEL1_CONFIG.MAX_SPEED - 10);
    const intensity = shakeProgress * 1.4; 
    refs.shake.x = (Math.random() - 0.5) * intensity;
    refs.shake.y = (Math.random() - 0.5) * intensity;
  } else {
    refs.shake.x = 0;
    refs.shake.y = 0;
  }

  // 4. Линии скорости
  if (currentSpeed > 9 && Math.random() < 0.25 * timeScale) {
    const roadX = (canvas.width - LEVEL1_CONFIG.ROAD_WIDTH) / 2;
    const isLeft = Math.random() > 0.5;
    const xOffset = isLeft ? -20 - (Math.random() * 40) : LEVEL1_CONFIG.ROAD_WIDTH + 20 + (Math.random() * 40);
    refs.speedLines.push({ id: Math.random().toString(), x: roadX + xOffset, y: -150, length: 80 + Math.random() * 150, speed: currentSpeed * (1.8 + Math.random() * 0.5), opacity: 0.3 + Math.random() * 0.4 });
  }

  for (let i = refs.speedLines.length - 1; i >= 0; i--) {
      const line = refs.speedLines[i];
      line.y += line.speed * timeScale;
      if (line.y >= canvas.height) refs.speedLines.splice(i, 1);
  }

  // 5. Дистанция
  const OUTRO_EXIT_SPEED = 5;
  if (!refs.isOutro) {
    const TARGET_TIME_SECONDS = 60; 
    const METERS_PER_SECOND_BASE = LEVEL1_CONFIG.WIN_DISTANCE / TARGET_TIME_SECONDS; 
    const METERS_PER_FRAME_BASE = METERS_PER_SECOND_BASE / 60; 
    const speedMultiplier = currentSpeed / LEVEL1_CONFIG.INITIAL_SPEED;
    const distanceDelta = speedMultiplier * METERS_PER_FRAME_BASE * timeScale;
    
    refs.gameState.distance += distanceDelta;
    refs.gameState.score += distanceDelta;

    if (refs.gameState.distance >= LEVEL1_CONFIG.WIN_DISTANCE) {
        refs.isOutro = true;
    }
  } else {
      // Плавный уезд вперед в аутро
      refs.outroExitOffset += OUTRO_EXIT_SPEED * timeScale;
      // Если полностью уехал - завершаем уровень
      if (p.y + p.height < -100) {
          onComplete(Math.floor(refs.gameState.score), refs.timeElapsed);
          return false;
      }
  }

  // 6. Поворот и Окружение
  // Блокируем повороты в аутро
  const steerAccel = 0.35 * timeScale;
  const steerFriction = Math.pow(0.90, timeScale);
  const maxSteerSpeed = 4.8;
  const isTurningLeft = !refs.isOutro && keys.has('ArrowLeft');
  const isTurningRight = !refs.isOutro && keys.has('ArrowRight');
  
  if (isTurningLeft || isTurningRight) {
      if (isTurningLeft) refs.playerVelocityX -= steerAccel;
      if (isTurningRight) refs.playerVelocityX += steerAccel;
      refs.turnDuration += timeScale;
      if (refs.turnDuration > 25 && currentSpeed > 8) {
          const driftChance = 0.4 * timeScale;
          if (Math.random() < driftChance) {
             const isLeftTire = Math.random() > 0.5;
             spawnParticle(refs, (isLeftTire ? p.x : p.x + p.width) + (Math.random() * 10 - 5), p.y + 15, (Math.random() - 0.5) * 3, (Math.random() * 2), 3 + Math.random() * 4, 0.8);
          }
      }
  } else {
      refs.turnDuration = 0;
      refs.playerVelocityX *= steerFriction;
  }

  refs.playerVelocityX = Math.max(-maxSteerSpeed, Math.min(maxSteerSpeed, refs.playerVelocityX));
  p.x += refs.playerVelocityX * timeScale;

  // 7. Стены
  if (refs.wallBumpCooldown > 0) refs.wallBumpCooldown -= timeScale;
  if (p.x <= 0 || p.x >= LEVEL1_CONFIG.ROAD_WIDTH - LEVEL1_CONFIG.PLAYER_WIDTH) {
    if (refs.wallBumpCooldown <= 0 && Math.abs(refs.playerVelocityX) > 1.0) {
      const phrase = getNextPhrase(LEVEL1_CONFIG.PHRASES.WALL_BUMP, refs.wallBumpHistory);
      addFloatingMessage(refs.floatingMessages, phrase, p.x, p.y);
      refs.wallBumpCooldown = 60; 
    }
    if (p.x < 0) { p.x = 0; refs.playerVelocityX *= -0.5; }
    if (p.x > LEVEL1_CONFIG.ROAD_WIDTH - LEVEL1_CONFIG.PLAYER_WIDTH) { p.x = LEVEL1_CONFIG.ROAD_WIDTH - LEVEL1_CONFIG.PLAYER_WIDTH; refs.playerVelocityX *= -0.5; }
  }
  
  // 8. Камера и Оффсеты
  const BASE_OFFSET = 260; 
  const SURGE_PEAK_OFFSET = 350; 
  const HIGH_SPEED_OFFSET = 140; 
  const BRAKING_OFFSET = 290; 
  const SURGE_SPEED_END = 11.5; 

  const targetIntensity = isAccelerating ? 1.0 : 0.0;
  refs.engineIntensity += (targetIntensity - refs.engineIntensity) * 0.15 * timeScale;

  let targetOffset = BASE_OFFSET;
  if (isBraking) { targetOffset = BRAKING_OFFSET; refs.engineIntensity = 0; } 
  else {
      let coastOffset = BASE_OFFSET;
      if (currentSpeed > LEVEL1_CONFIG.INITIAL_SPEED) {
           const t = (currentSpeed - LEVEL1_CONFIG.INITIAL_SPEED) / (LEVEL1_CONFIG.MAX_SPEED - LEVEL1_CONFIG.INITIAL_SPEED);
           coastOffset = BASE_OFFSET - (t * (BASE_OFFSET - HIGH_SPEED_OFFSET));
      }
      let surgeOffset = BASE_OFFSET;
      if (currentSpeed <= LEVEL1_CONFIG.INITIAL_SPEED) surgeOffset = BASE_OFFSET;
      else if (currentSpeed <= SURGE_SPEED_END) { const t = (currentSpeed - LEVEL1_CONFIG.INITIAL_SPEED) / (SURGE_SPEED_END - LEVEL1_CONFIG.INITIAL_SPEED); surgeOffset = BASE_OFFSET + (t * (SURGE_PEAK_OFFSET - BASE_OFFSET)); }
      else { const t = (currentSpeed - SURGE_SPEED_END) / (LEVEL1_CONFIG.MAX_SPEED - SURGE_SPEED_END); surgeOffset = SURGE_PEAK_OFFSET - (t * (SURGE_PEAK_OFFSET - HIGH_SPEED_OFFSET)); }
      targetOffset = coastOffset + (surgeOffset - coastOffset) * refs.engineIntensity;
  }

  let targetSnowAmp = 4;
  if (currentSpeed <= LEVEL1_CONFIG.INITIAL_SPEED) { const t = Math.max(0, (currentSpeed - LEVEL1_CONFIG.MIN_SPEED) / (LEVEL1_CONFIG.INITIAL_SPEED - LEVEL1_CONFIG.MIN_SPEED)); targetSnowAmp = 5 - (t * 1); }
  else { const t = Math.min(1, (currentSpeed - LEVEL1_CONFIG.INITIAL_SPEED) / (LEVEL1_CONFIG.MAX_SPEED - LEVEL1_CONFIG.INITIAL_SPEED)); targetSnowAmp = 4 - (t * 2); }
  refs.currentSnowAmplitude += (targetSnowAmp - refs.currentSnowAmplitude) * 0.05 * timeScale;

  const delta = targetOffset - refs.cameraOffset;
  let smoothingFactor = 0.05;
  if (isBraking) smoothingFactor = 0.03; 
  else {
      if (delta > 0) smoothingFactor = 0.12; 
      else { if (currentSpeed < SURGE_SPEED_END) smoothingFactor = 0.04; else smoothingFactor = 0.008; }
  }
  
  // В аутро камера плавно останавливает слежение
  if (refs.isOutro) smoothingFactor *= 0.5;
  
  refs.cameraOffset += (targetOffset - refs.cameraOffset) * smoothingFactor * timeScale;
  
  // Итоговая координата игрока с учетом аутро-смещения
  p.y = (canvas.height - refs.cameraOffset) - refs.outroExitOffset;
  
  refs.roadOffset = (refs.roadOffset + (currentSpeed * timeScale)) % 100;
  refs.environmentOffset = (refs.environmentOffset + (currentSpeed * timeScale));

  // 9. Спаун сущностей
  spawnTraffic(refs, timeScale);

  // --- ОБНОВЛЕНИЕ ТРАФИКА ---
  for (let i = refs.traffic.length - 1; i >= 0; i--) {
      const t = refs.traffic[i];

      // Стабилизация скорости трафика в аутро
      if (refs.isOutro) {
          t.speed += (STANDARD_OUTRO_SPEED - t.speed) * SPEED_SMOOTHING * timeScale;
          
          // Чтобы предотвратить столкновение с машиной перед игроком в аутро,
          // мы "проталкиваем" машину вперед вместе с игроком.
          // Если машина в той же полосе (или очень близко) и находится ПЕРЕД игроком:
          const distToPlayerX = Math.abs(t.x - p.x);
          if (distToPlayerX < 25 && t.y < p.y) {
             t.y -= OUTRO_EXIT_SPEED * timeScale;
          }
      }

      t.y += (currentSpeed - t.speed) * timeScale;
      if (t.y >= canvas.height + 500 || t.y <= -500) { refs.traffic.splice(i, 1); refs.nearMissCooldowns.delete(t.id); }
  }

  refs.traffic.sort((a, b) => a.y - b.y);

  for (let i = 0; i < refs.traffic.length; i++) {
      const car = refs.traffic[i];
      let isCarBraking = false;
      for (let j = i - 1; j >= 0; j--) {
          const ahead = refs.traffic[j];
          if (Math.abs(ahead.x - car.x) < 10) { 
              const dist = car.y - ahead.y - ahead.height; 
              if (dist < 150 && dist > -50) { 
                  if (car.speed > ahead.speed) isCarBraking = true;
                  car.speed = Math.max(car.speed, ahead.speed);
                  if (dist < 80) car.speed *= 0.95;
                  break; 
              }
          }
      }
      (car as any).isBraking = isCarBraking;
  }

  // 10. Столкновения (Активны ВСЕГДА, включая аутро)
  const hitboxPadding = 1.0; 
  for (let i = 0; i < refs.traffic.length; i++) {
    const t = refs.traffic[i];
    if (p.x + hitboxPadding < t.x + t.width - hitboxPadding && 
        p.x + p.width - hitboxPadding > t.x + hitboxPadding && 
        p.y + hitboxPadding < t.y + t.height - hitboxPadding && 
        p.y + p.height - hitboxPadding > t.y + hitboxPadding) {
      onGameOver(Math.floor(refs.gameState.score));
      return false; 
    }
  }

  // 11. Near Miss
  for (let i = 0; i < refs.traffic.length; i++) {
    const t = refs.traffic[i];
    const horizontalGap = Math.max(0, Math.abs(p.x - t.x) - p.width);
    const verticalGap = Math.max(0, Math.abs(p.y - t.y) - p.height);
    if (currentSpeed > 10 && horizontalGap < 12 && verticalGap < 12 && horizontalGap > 0.5) {
      if (!refs.nearMissCooldowns.has(t.id)) {
        const phrase = getNextPhrase(LEVEL1_CONFIG.PHRASES.NEAR_MISS, refs.nearMissHistory);
        addFloatingMessage(refs.floatingMessages, phrase, p.x, p.y);
        refs.nearMissCooldowns.add(t.id);
      }
    }
  }

  // Обновление floatingMessages
  for (let i = refs.floatingMessages.length - 1; i >= 0; i--) {
      const m = refs.floatingMessages[i];
      m.life -= 0.016 * timeScale;
      m.y -= 1.5 * timeScale;
      if (m.life <= 0) refs.floatingMessages.splice(i, 1);
  }

  return true;
};
