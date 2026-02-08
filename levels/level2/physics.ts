
import { LEVEL2_CONFIG, SECURITY_CONFIG, BOSS_CONFIG } from './config';
import { Level2State, Platform, Enemy } from './types';

// Проверка пересечения прямоугольников (AABB)
const checkCollision = (
  r1: { x: number; y: number; width: number; height: number },
  r2: { x: number; y: number; width: number; height: number }
): boolean => {
  const pad = 4;
  return (
    r1.x + pad < r2.x + r2.width - pad &&
    r1.x + r1.width - pad > r2.x + pad &&
    r1.y + pad < r2.y + r2.height - pad &&
    r1.y + r1.height - pad > r2.y + pad
  );
};

export const updateLevel2 = (
  state: Level2State,
  keys: Set<string>,
  isScreaming: boolean, // NEW: Microphone input flag
  timeScale: number,
  canvasWidth: number,
  canvasHeight: number,
  onGameOver: () => void,
  onComplete: () => void
) => {
  const { player } = state;

  // --- SPECIAL SURFACE LOGIC ---
  let speedMultiplier = 1.0;
  const isOnMeetingTable = player.isGrounded && player.currentPlatformType === 'meeting_table';
  
  if (isOnMeetingTable) {
      speedMultiplier = 1.3; // 30% Speed Boost on Meeting Tables
  }

  // 1. Горизонтальное движение (Ускорение)
  const acceleration = 1.5 * timeScale * speedMultiplier;
  const maxSpeed = LEVEL2_CONFIG.MOVE_SPEED * speedMultiplier;
  
  // Disable normal movement if being bounced
  if (player.invulnerableTimer > 40) { // Still reeling from hit
       // No input control during knockback
       player.vx *= 0.95; // Drag during knockback
  } else {
      if (keys.has('ArrowRight')) {
        player.vx += acceleration;
        player.facingRight = true;
      } else if (keys.has('ArrowLeft')) {
        player.vx -= acceleration;
        player.facingRight = false;
      } else {
        // Трение
        player.vx *= Math.pow(LEVEL2_CONFIG.FRICTION, timeScale);
      }
  }

  // Normal speed clamping
  player.vx = Math.max(Math.min(player.vx, maxSpeed), -maxSpeed);
  player.x += player.vx * timeScale;
  
  if (Math.abs(player.vx) > 0.1 && player.isGrounded) {
      player.frameTimer += timeScale * speedMultiplier; 
  }

  // 2. Вертикальное движение (Гравитация)
  // Применяем гравитацию только если не стоим на земле, чтобы избежать накопления скорости
  if (!player.isGrounded) {
      player.vy += LEVEL2_CONFIG.GRAVITY * timeScale;
  }
  
  // Reset trampoline boost logic
  if (player.isBoosted && (player.vy >= 0 || player.isGrounded)) {
      player.isBoosted = false;
  }
  
  if (keys.has('ArrowUp') && player.isGrounded) {
    player.vy = LEVEL2_CONFIG.JUMP_FORCE; 
    player.isGrounded = false;
    player.isJumping = true;
    player.currentPlatformType = null; 
  }

  // Применяем скорость по Y
  player.y += player.vy * timeScale;

  // 3. СТОЛКНОВЕНИЯ С ПЛАТФОРМАМИ (Fixed Jitter)
  
  // Сбрасываем флаг земли перед проверкой. 
  // Мы поставим его обратно в true, если найдем опору.
  player.isGrounded = false;
  let foundPlatformType: Platform['type'] | null = null;

  // А) Проверка пола
  const floorY = canvasHeight - LEVEL2_CONFIG.FLOOR_HEIGHT;
  if (player.y + player.height >= floorY) {
    player.y = floorY - player.height;
    player.vy = 0;
    player.isGrounded = true;
    player.isJumping = false;
    foundPlatformType = 'floor';
  }

  // Б) Проверка платформ
  // Используем логику "Feet Check" вместо общего AABB с padding, чтобы избежать тряски
  const detectionRange = 200; 
  // Сужаем область проверки ног по X, чтобы нельзя было стоять на самом краешке пикселя
  const feetMargin = 8; 

  for (const plat of state.platforms) {
      // Optimizaton: Fast X rejection
      if (plat.x > player.x + detectionRange || plat.x + plat.width < player.x - detectionRange) {
          continue;
      }

      // 1. Проверка по X (в пределах ширины платформы)
      const playerRight = player.x + player.width - feetMargin;
      const playerLeft = player.x + feetMargin;
      
      if (playerRight > plat.x && playerLeft < plat.x + plat.width) {
          
          // 2. Проверка по Y (Landing logic)
          // Мы проверяем, находятся ли ноги игрока "внутри" верхней части платформы
          // или чуть выше неё (если скорость большая)
          const feetY = player.y + player.height;
          const platTop = plat.y;
          
          // Погрешность для "примагничивания" (snap threshold)
          // Если мы падаем (vy >= 0) И ноги пересекли верхнюю грань, но не ушли слишком глубоко
          if (player.vy >= 0 && feetY >= platTop && feetY <= platTop + 20) {
              
              // --- TRAMPOLINE MECHANIC ---
              if (plat.type === 'sofa' || plat.type === 'armchair') {
                  player.y = plat.y - player.height;
                  // Increased bounce from -17 to -19
                  player.vy = -19; 
                  player.isGrounded = false; 
                  player.isJumping = true;
                  player.currentPlatformType = null;
                  player.isBoosted = true;
                  // Don't stop update, keep checking other potential things? No, we bounced.
                  foundPlatformType = null; // Important not to set grounded
              } else {
                  // Normal Landing
                  player.y = plat.y - player.height; // Snap exactly to top
                  player.vy = 0;
                  player.isGrounded = true;
                  player.isJumping = false;
                  foundPlatformType = plat.type;
              }
          }
      }
  }
  
  // Если мы нашли платформу (или пол), сохраняем тип
  if (foundPlatformType) {
      player.currentPlatformType = foundPlatformType;
  } else if (!player.isGrounded) {
      // Если ни с чем не столкнулись, сбрасываем тип
      player.currentPlatformType = null;
  }

  // --- ENEMY LOGIC (SECURITY) ---

  // 1. Spawning
  const distSinceLastSpawn = player.x - state.lastEnemySpawnX;
  const activeEnemies = state.enemies.length;
  
  if (activeEnemies < SECURITY_CONFIG.MAX_ON_SCREEN && distSinceLastSpawn > SECURITY_CONFIG.SPAWN_MIN_DIST) {
      const shouldSpawn = distSinceLastSpawn > SECURITY_CONFIG.SPAWN_MAX_DIST || Math.random() < 0.02 * timeScale;
      
      if (shouldSpawn) {
          const spawnX = state.cameraX + canvasWidth + 50;
          const levelLen = state.levelLength || LEVEL2_CONFIG.LEVEL_LENGTH;
          
          // STOP SPAWNING NEAR EXIT (Buffer 2000px)
          if (spawnX < levelLen - 2000) {
              const spawnY = floorY - SECURITY_CONFIG.HEIGHT;
              const patrolRadius = SECURITY_CONFIG.PATROL_RADIUS_OPTIONS[Math.floor(Math.random() * SECURITY_CONFIG.PATROL_RADIUS_OPTIONS.length)];
              const triggerDist = SECURITY_CONFIG.TRIGGER_DISTANCE_OPTIONS[Math.floor(Math.random() * SECURITY_CONFIG.TRIGGER_DISTANCE_OPTIONS.length)];
              
              const newEnemy: Enemy = {
                  id: Math.random().toString(),
                  x: spawnX,
                  y: spawnY,
                  width: SECURITY_CONFIG.WIDTH,
                  height: SECURITY_CONFIG.HEIGHT,
                  type: 'security',
                  state: 'patrol',
                  startX: spawnX, 
                  patrolDir: -1,   
                  patrolMaxDist: patrolRadius, 
                  triggerDistance: triggerDist, 
                  vx: 0,
                  frameTimer: 0
              };
              
              state.enemies.push(newEnemy);
              state.lastEnemySpawnX = player.x;
          }
      }
  }

  // 2. Update Enemies
  for (let i = state.enemies.length - 1; i >= 0; i--) {
      const e = state.enemies[i];
      const distToPlayer = e.x - player.x;
      
      if (e.state === 'patrol') {
          e.vx = SECURITY_CONFIG.PATROL_SPEED * e.patrolDir;
          e.x += e.vx * timeScale;
          e.frameTimer += timeScale;

          const distFromStart = e.x - e.startX;
          if (distFromStart < -e.patrolMaxDist && e.patrolDir === -1) {
              e.patrolDir = 1;
          } else if (distFromStart > e.patrolMaxDist && e.patrolDir === 1) {
              e.patrolDir = -1;
          }

          if (distToPlayer < e.triggerDistance && distToPlayer > -100) {
              e.state = 'running';
          }
      } 
      else if (e.state === 'running') {
          e.vx = -SECURITY_CONFIG.RUN_SPEED; 
          e.frameTimer += timeScale;
          e.x += e.vx * timeScale;
      } 
      
      if (e.x + e.width < state.cameraX - 100) {
          state.enemies.splice(i, 1);
          continue;
      }
      
      // Collision with Player
      if (player.invulnerableTimer <= 0 && checkCollision(
          { x: player.x, y: player.y, width: player.width, height: player.height },
          { x: e.x, y: e.y, width: e.width, height: e.height }
      )) {
          // HIT LOGIC
          player.hp -= 1;
          player.invulnerableTimer = 60; // 1 second invulnerability
          
          // Knockback from guard
          const dir = player.x < e.x ? -1 : 1;
          player.vx = dir * 12; // Push away
          player.vy = -7;       // Slight hop
          player.isGrounded = false;

          // Check for Death
          if (player.hp <= 0) {
              onGameOver();
              return; 
          }
      }
  }

  // --- BOSS LOGIC ---
  if (state.boss) {
      state.boss.frameTimer += timeScale;
      
      // Cooldowns
      if (state.boss.invulnerableTimer > 0) state.boss.invulnerableTimer -= timeScale;
      if (state.boss.damagedTimer > 0) state.boss.damagedTimer -= timeScale;

      // 1. Boss Collision (Bounce Back)
      if (checkCollision(
          { x: player.x, y: player.y, width: player.width, height: player.height },
          { x: state.boss.x, y: state.boss.y, width: state.boss.width, height: state.boss.height }
      )) {
          // Push player back
          player.x = state.boss.x - player.width - 2;
          player.vx = BOSS_CONFIG.BOUNCE_FORCE_X;
          player.vy = BOSS_CONFIG.BOUNCE_FORCE_Y;
          player.isGrounded = false;
      }

      // Check if boss is on screen (visible to player)
      const bossRight = state.boss.x + state.boss.width;
      const screenLeft = state.cameraX;
      const screenRight = state.cameraX + canvasWidth;
      const isBossOnScreen = bossRight > screenLeft && state.boss.x < screenRight;

      if (isBossOnScreen) {
          // --- SCREAM DAMAGE LOGIC ---
          // Detect falling edge: Was screaming (True) -> Stopped (False)
          const justStoppedScreaming = state.wasScreaming && !isScreaming;
          
          if (justStoppedScreaming && state.boss.invulnerableTimer <= 0) {
              state.boss.hp -= 1;
              state.boss.invulnerableTimer = BOSS_CONFIG.DAMAGE_COOLDOWN;
              state.boss.damagedTimer = 15; // Flash effect for 15 frames
              
              if (state.boss.hp <= 0) {
                  onComplete(); // WIN!
                  return;
              }
          }
          // --------------------------

          state.boss.attackTimer += (1000 / 60) * timeScale; // Add ms
          
          if (state.boss.attackTimer >= state.boss.timeToNextAttack) {
              // FIRE!
              const spawnY = state.boss.y + 60; // Shoulder height roughly
              const spawnX = state.boss.x;
              
              // Calculate vector to player center
              const dx = player.x - spawnX;
              const dy = (player.y + player.height/2) - spawnY;
              const baseAngle = Math.atan2(dy, dx);
              
              // BURST FIRE: 1 to 3 papers
              const burstCount = Math.floor(Math.random() * 3) + 1; // 1, 2 or 3

              for (let k = 0; k < burstCount; k++) {
                  // AVOID DIRECT HIT: Ensure trajectory is never directly at player center
                  // Add a minimum offset of 0.15 radians (~8.5 degrees) up or down
                  const minSpread = 0.15; 
                  const addSpread = Math.random() * 0.35; // Random range [0, 0.35]
                  const dir = Math.random() > 0.5 ? 1 : -1;
                  
                  const spread = dir * (minSpread + addSpread);
                  const angle = baseAngle + spread;
                  
                  // Vary speed slightly
                  const speedMult = 0.9 + Math.random() * 0.2;
                  const speed = BOSS_CONFIG.PROJECTILE_SPEED * speedMult;

                  const vx = Math.cos(angle) * speed;
                  const vy = Math.sin(angle) * speed;

                  state.projectiles.push({
                      id: Math.random().toString(),
                      x: spawnX,
                      y: spawnY,
                      vx: vx,
                      vy: vy,
                      width: BOSS_CONFIG.PROJECTILE_WIDTH,
                      height: BOSS_CONFIG.PROJECTILE_HEIGHT,
                      rotation: Math.random() * Math.PI, // Random initial spin
                      type: 'paper_stack'
                  });
              }

              // Reset Timer
              state.boss.attackTimer = 0;
              // Randomize next attack time (3-5 seconds)
              state.boss.timeToNextAttack = BOSS_CONFIG.ATTACK_INTERVAL_MIN + 
                  Math.random() * (BOSS_CONFIG.ATTACK_INTERVAL_MAX - BOSS_CONFIG.ATTACK_INTERVAL_MIN);
          }
      }
  }

  // --- PROJECTILES LOGIC ---
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
      const p = state.projectiles[i];
      
      p.x += p.vx * timeScale;
      p.y += p.vy * timeScale;
      p.rotation += 0.2 * timeScale; // Spin

      // Check hits
      if (player.invulnerableTimer <= 0 && checkCollision(
          { x: player.x, y: player.y, width: player.width, height: player.height },
          { x: p.x, y: p.y, width: p.width, height: p.height }
      )) {
          // HIT!
          player.hp -= 1;
          player.invulnerableTimer = 60; // 1 second invulnerability
          
          // Knockback
          player.vx = -12;
          player.vy = -6;
          player.isGrounded = false;

          state.projectiles.splice(i, 1);
          
          if (player.hp <= 0) {
              onGameOver();
              return;
          }
          continue;
      }

      // Despawn if out of bounds
      if (p.x < state.cameraX - 100 || p.y > canvasHeight + 100) {
          state.projectiles.splice(i, 1);
      }
  }

  // Invulnerability tick
  if (player.invulnerableTimer > 0) {
      player.invulnerableTimer -= timeScale;
  }

  // --- SPEED LINES LOGIC ---
  // 1. Horizontal Wind
  if (isOnMeetingTable && Math.abs(player.vx) > 2) {
      if (Math.random() < 0.4 * timeScale) {
          const isRight = player.vx > 0;
          state.speedLines.push({
              id: Math.random().toString(),
              x: player.x + (Math.random() * 100 - 50) + (isRight ? 20 : -20),
              y: player.y + (Math.random() * player.height),
              length: 40 + Math.random() * 60,
              speed: (Math.random() * 5 + 10) * (isRight ? -1 : 1),
              opacity: 0.5 + Math.random() * 0.5,
              isVertical: false,
              followPlayer: false
          });
      }
  }

  // 2. Vertical Wind (Boost)
  if (player.isBoosted) {
      if (Math.random() < 0.8 * timeScale) {
           const offsetX = (Math.random() * 60) - 30; 
           state.speedLines.push({
               id: Math.random().toString(),
               x: player.x + offsetX, 
               y: player.y + Math.random() * 50 - 20, 
               length: 30 + Math.random() * 40,
               speed: 15 + Math.random() * 10, 
               opacity: 0.6 + Math.random() * 0.4,
               isVertical: true,
               followPlayer: true,
               offsetX: offsetX
           });
      }
  }

  // Update lines
  for (let i = state.speedLines.length - 1; i >= 0; i--) {
      const line = state.speedLines[i];
      if (line.isVertical) {
          line.y += line.speed * timeScale; 
          line.opacity -= 0.08 * timeScale; 
          if (line.followPlayer) {
              line.x = player.x + (line.offsetX || 0);
          }
      } else {
          line.x += line.speed * timeScale; 
          line.opacity -= 0.05 * timeScale;
      }
      if (line.opacity <= 0) {
          state.speedLines.splice(i, 1);
      }
  }

  // 4. Камера
  if (state.cameraX > state.maxCameraX) state.maxCameraX = state.cameraX;

  const leftTrigger = Math.min(350, canvasWidth * 0.4);
  const rightTrigger = Math.max(leftTrigger + 50, canvasWidth * 0.35);
  const playerScreenX = player.x - state.cameraX;
  let targetCamX = state.cameraX;

  if (playerScreenX > rightTrigger) {
      targetCamX = player.x - rightTrigger;
  } else if (playerScreenX < leftTrigger) {
      targetCamX = player.x - leftTrigger;
  }
  
  const MAX_BACKTRACK_DISTANCE = 500;
  const minAllowedCamX = Math.max(0, state.maxCameraX - MAX_BACKTRACK_DISTANCE);
  if (targetCamX < minAllowedCamX) targetCamX = minAllowedCamX;
  state.cameraX = targetCamX;

  if (player.x < state.cameraX) {
      player.x = state.cameraX;
      player.vx = 0;
  }

  // 5. Условия
  if (player.y > canvasHeight + 100) onGameOver();
  // REMOVED: if (player.x > LEVEL2_CONFIG.LEVEL_LENGTH + 50) onComplete();
  // Now Level Completion is handled via Boss Death or Exit door collision (if implemented)
  // For now, let's keep exit door collision just in case boss logic fails or for fallback
  if (player.x > LEVEL2_CONFIG.LEVEL_LENGTH + 200) onComplete();
  
  state.gameTime += 1 * timeScale;
  state.wasScreaming = isScreaming; // Update state for next frame
};
