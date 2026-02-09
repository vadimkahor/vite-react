
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

// Функция для выбора фразы, которая не совпадает с предыдущей
const getNonRepeatingPhrase = (phrases: string[], lastPhrase?: string): string => {
  const available = lastPhrase ? phrases.filter(p => p !== lastPhrase) : phrases;
  const source = available.length > 0 ? available : phrases;
  return source[Math.floor(Math.random() * source.length)];
};

// --- PHRASE LISTS ---
const KATYA_SCREAM_PHRASES = [
    '@#$!',
    '%$#@!',
    '#@!$%',
    '!@#$%&',
    '&*@#!$',
    '@#$%^&!',
    '%$#@!*&',
    '&*@#!$%'
];

const VICTORIA_DAMAGE_PHRASES = [
    'Екатерина Борисовна, ну что же вы...',
    'Это обидно!',
    'Не кричите на меня',
    'Не повышайте голос',
    'Да как вы смеете...',
    'Пожалуйста, прекратите!',
    'Это возмутительно!',
    'Я буду жаловаться!',
    'Прекратите хамить!',
    'Меня так никто не называл!'
];

export const updateLevel2 = (
  state: Level2State,
  keys: Set<string>,
  isScreaming: boolean,
  isGameplayActive: boolean,
  isBossFightActive: boolean,
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
      speedMultiplier = 1.3; 
  }

  // 1. Горизонтальное движение
  const acceleration = 1.5 * timeScale * speedMultiplier;
  const maxSpeed = LEVEL2_CONFIG.MOVE_SPEED * speedMultiplier;
  
  if (player.invulnerableTimer > 40) { 
       player.vx *= 0.95; 
  } else {
      if (keys.has('ArrowRight')) {
        player.vx += acceleration;
        player.facingRight = true;
      } else if (keys.has('ArrowLeft')) {
        player.vx -= acceleration;
        player.facingRight = false;
      } else {
        player.vx *= Math.pow(LEVEL2_CONFIG.FRICTION, timeScale);
      }
  }

  player.vx = Math.max(Math.min(player.vx, maxSpeed), -maxSpeed);
  player.x += player.vx * timeScale;
  
  if (Math.abs(player.vx) > 0.1 && player.isGrounded) {
      player.frameTimer += timeScale * speedMultiplier; 
  }

  // 2. Вертикальное движение
  if (!player.isGrounded) {
      player.vy += LEVEL2_CONFIG.GRAVITY * timeScale;
  }
  
  if (player.isBoosted && (player.vy >= 0 || player.isGrounded)) {
      player.isBoosted = false;
  }
  
  if (keys.has('ArrowUp') && player.isGrounded) {
    player.vy = LEVEL2_CONFIG.JUMP_FORCE; 
    player.isGrounded = false;
    player.isJumping = true;
    player.currentPlatformType = null; 
  }

  player.y += player.vy * timeScale;

  // 3. СТОЛКНОВЕНИЯ С ПЛАТФОРМАМИ
  player.isGrounded = false;
  let foundPlatformType: Platform['type'] | null = null;

  const floorY = canvasHeight - LEVEL2_CONFIG.FLOOR_HEIGHT;
  if (player.y + player.height >= floorY) {
    player.y = floorY - player.height;
    player.vy = 0;
    player.isGrounded = true;
    player.isJumping = false;
    foundPlatformType = 'floor';
  }

  const detectionRange = 200; 
  const feetMargin = 8; 

  for (const plat of state.platforms) {
      if (plat.x > player.x + detectionRange || plat.x + plat.width < player.x - detectionRange) {
          continue;
      }
      const playerRight = player.x + player.width - feetMargin;
      const playerLeft = player.x + feetMargin;
      if (playerRight > plat.x && playerLeft < plat.x + plat.width) {
          const feetY = player.y + player.height;
          const platTop = plat.y;
          if (player.vy >= 0 && feetY >= platTop && feetY <= platTop + 20) {
              if (plat.type === 'sofa' || plat.type === 'armchair') {
                  player.y = plat.y - player.height;
                  player.vy = -19; 
                  player.isGrounded = false; 
                  player.isJumping = true;
                  player.currentPlatformType = null;
                  player.isBoosted = true;
                  foundPlatformType = null;
              } else {
                  player.y = plat.y - player.height; 
                  player.vy = 0;
                  player.isGrounded = true;
                  player.isJumping = false;
                  foundPlatformType = plat.type;
              }
          }
      }
  }
  
  if (foundPlatformType) {
      player.currentPlatformType = foundPlatformType;
  } else if (!player.isGrounded) {
      player.currentPlatformType = null;
  }

  // --- UPDATE PLAYER SPEECH BUBBLE ---
  if (player.activeBubble) {
      player.activeBubble.timer -= timeScale;
      if (player.activeBubble.timer <= 0) {
          player.activeBubble = undefined;
      }
  }

  // --- ENEMY LOGIC (SECURITY) ---
  const distSinceLastSpawn = player.x - state.lastEnemySpawnX;
  const activeEnemies = state.enemies.length;
  
  if (activeEnemies < SECURITY_CONFIG.MAX_ON_SCREEN && distSinceLastSpawn > SECURITY_CONFIG.SPAWN_MIN_DIST) {
      const shouldSpawn = distSinceLastSpawn > SECURITY_CONFIG.SPAWN_MAX_DIST || Math.random() < 0.02 * timeScale;
      if (shouldSpawn) {
          const spawnX = state.cameraX + canvasWidth + 50;
          const levelLen = state.levelLength || LEVEL2_CONFIG.LEVEL_LENGTH;
          if (spawnX < levelLen - 2000) {
              const spawnY = floorY - SECURITY_CONFIG.HEIGHT;
              const patrolRadius = SECURITY_CONFIG.PATROL_RADIUS_OPTIONS[Math.floor(Math.random() * SECURITY_CONFIG.PATROL_RADIUS_OPTIONS.length)];
              const triggerDist = SECURITY_CONFIG.TRIGGER_DISTANCE_OPTIONS[Math.floor(Math.random() * SECURITY_CONFIG.TRIGGER_DISTANCE_OPTIONS.length)];
              const newEnemy: Enemy = {
                  id: Math.random().toString(),
                  x: spawnX, y: spawnY, width: SECURITY_CONFIG.WIDTH, height: SECURITY_CONFIG.HEIGHT,
                  type: 'security', state: 'patrol', startX: spawnX, patrolDir: -1,   
                  patrolMaxDist: patrolRadius, triggerDistance: triggerDist, vx: 0, frameTimer: 0, hasBeenJumpedOver: false
              };
              state.enemies.push(newEnemy);
              state.lastEnemySpawnX = player.x;
          }
      }
  }

  for (let i = state.enemies.length - 1; i >= 0; i--) {
      const e = state.enemies[i];
      const distToPlayer = e.x - player.x;
      if (e.speechBubble) {
          e.speechBubble.timer -= timeScale;
          if (e.speechBubble.timer <= 0) e.speechBubble = undefined;
      }
      if (e.state === 'patrol') {
          e.vx = SECURITY_CONFIG.PATROL_SPEED * e.patrolDir;
          e.x += e.vx * timeScale;
          e.frameTimer += timeScale;
          const distFromStart = e.x - e.startX;
          if (distFromStart < -e.patrolMaxDist && e.patrolDir === -1) { e.patrolDir = 1; }
          else if (distFromStart > e.patrolMaxDist && e.patrolDir === 1) { e.patrolDir = -1; }
          if (distToPlayer < e.triggerDistance && distToPlayer > -100) {
              e.state = 'running';
              const text = getNonRepeatingPhrase(LEVEL2_CONFIG.PHRASES.GUARD_SHOUTS, state.lastGuardPhrase);
              e.speechBubble = { text: text, timer: 90, maxTimer: 90 };
              state.lastGuardPhrase = text;
          }
      } 
      else if (e.state === 'running') {
          e.vx = -SECURITY_CONFIG.RUN_SPEED; 
          e.frameTimer += timeScale;
          e.x += e.vx * timeScale;
      } 
      if (!e.hasBeenJumpedOver && player.x > e.x + e.width) {
          e.hasBeenJumpedOver = true;
          // Добавлено ограничение по кулдауну для реплик Кати
          if (state.katyaSpeechCooldown <= 0) {
              const text = getNonRepeatingPhrase(LEVEL2_CONFIG.PHRASES.KATYA_TAUNTS, state.lastKatyaPhrase);
              player.activeBubble = { text: text, timer: 90, maxTimer: 90 };
              state.lastKatyaPhrase = text;
              state.katyaSpeechCooldown = 180; // 3 секунды кулдауна
          }
      }
      if (e.x + e.width < state.cameraX - 100) { state.enemies.splice(i, 1); continue; }
      if (player.invulnerableTimer <= 0 && checkCollision(
          { x: player.x, y: player.y, width: player.width, height: player.height },
          { x: e.x, y: e.y, width: e.width, height: e.height }
      )) {
          player.hp -= 1;
          player.invulnerableTimer = 60; 
          const dir = player.x < e.x ? -1 : 1;
          player.vx = dir * 12; 
          player.vy = -7;       
          player.isGrounded = false;
          if (player.hp <= 0) { onGameOver(); return; }
      }
  }

  // --- BOSS LOGIC ---
  if (state.boss) {
      const boss = state.boss;
      boss.frameTimer += timeScale;
      if (boss.invulnerableTimer > 0) boss.invulnerableTimer -= timeScale;
      if (boss.damagedTimer > 0) boss.damagedTimer -= timeScale;
      
      // Update Boss Speech Bubble Timer
      if (boss.speechBubble) {
          boss.speechBubble.timer -= timeScale;
          if (boss.speechBubble.timer <= 0) boss.speechBubble = undefined;
      }

      // Update Delayed reaction timer
      if (boss.pendingSpeechTimer !== undefined && boss.pendingSpeechTimer > 0) {
          boss.pendingSpeechTimer -= timeScale;
          if (boss.pendingSpeechTimer <= 0) {
              boss.speechBubble = {
                  text: boss.pendingSpeechText || "",
                  timer: 90,
                  maxTimer: 90
              };
              boss.pendingSpeechTimer = undefined;
          }
      }

      if (checkCollision(
          { x: player.x, y: player.y, width: player.width, height: player.height },
          { x: boss.x, y: boss.y, width: boss.width, height: boss.height }
      )) {
          player.x = boss.x - player.width - 2;
          player.vx = BOSS_CONFIG.BOUNCE_FORCE_X;
          player.vy = BOSS_CONFIG.BOUNCE_FORCE_Y;
          player.isGrounded = false;
      }

      const bossRight = boss.x + boss.width;
      const screenLeft = state.cameraX;
      const screenRight = state.cameraX + canvasWidth;
      const isBossOnScreen = bossRight > screenLeft && boss.x < screenRight;

      if (isBossOnScreen) {
          // --- SCREAM DAMAGE LOGIC ---
          const justStoppedScreaming = state.wasScreaming && !isScreaming;
          if (isBossFightActive && isGameplayActive) {
              if (justStoppedScreaming && boss.invulnerableTimer <= 0) {
                  boss.hp -= 1;
                  boss.invulnerableTimer = BOSS_CONFIG.DAMAGE_COOLDOWN;
                  boss.damagedTimer = 15; 
                  
                  // KATYA BUBBLE (ONLY ON DAMAGE)
                  const scream = getNonRepeatingPhrase(KATYA_SCREAM_PHRASES, state.lastKatyaPhrase);
                  player.activeBubble = {
                      text: scream,
                      timer: 90,
                      maxTimer: 90
                  };
                  state.lastKatyaPhrase = scream;

                  // QUEUE VICTORIA COMPLAINT (DELAYED BY 1 SEC)
                  const complaint = getNonRepeatingPhrase(VICTORIA_DAMAGE_PHRASES, state.lastGuardPhrase);
                  boss.pendingSpeechTimer = 60; // Approx 1 second
                  boss.pendingSpeechText = complaint;
                  state.lastGuardPhrase = complaint;
                  
                  if (boss.hp <= 0) {
                      onComplete();
                      return;
                  }
              }
          }

          if (isGameplayActive && isBossFightActive) {
              boss.attackTimer += (1000 / 60) * timeScale; 
              if (boss.attackTimer >= boss.timeToNextAttack) {
                  const spawnY = boss.y + 60; 
                  const spawnX = boss.x;
                  const dx = player.x - spawnX;
                  const dy = (player.y + player.height/2) - spawnY;
                  const baseAngle = Math.atan2(dy, dx);
                  const burstCount = Math.floor(Math.random() * 3) + 1; 
                  for (let k = 0; k < burstCount; k++) {
                      const minSpread = 0.15; 
                      const addSpread = Math.random() * 0.35; 
                      const dir = Math.random() > 0.5 ? 1 : -1;
                      const spread = dir * (minSpread + addSpread);
                      const angle = baseAngle + spread;
                      const speedMult = 0.9 + Math.random() * 0.2;
                      const speed = BOSS_CONFIG.PROJECTILE_SPEED * speedMult;
                      const vx = Math.cos(angle) * speed;
                      const vy = Math.sin(angle) * speed;
                      state.projectiles.push({
                          id: Math.random().toString(),
                          x: spawnX, y: spawnY, vx: vx, vy: vy,
                          width: BOSS_CONFIG.PROJECTILE_WIDTH, height: BOSS_CONFIG.PROJECTILE_HEIGHT,
                          rotation: Math.random() * Math.PI, type: 'paper_stack'
                      });
                  }
                  boss.attackTimer = 0;
                  boss.timeToNextAttack = BOSS_CONFIG.ATTACK_INTERVAL_MIN + 
                      Math.random() * (BOSS_CONFIG.ATTACK_INTERVAL_MAX - BOSS_CONFIG.ATTACK_INTERVAL_MIN);
              }
          }
      }
  }

  // --- PROJECTILES LOGIC ---
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
      const p = state.projectiles[i];
      p.x += p.vx * timeScale;
      p.y += p.vy * timeScale;
      p.rotation += 0.2 * timeScale; 
      if (player.invulnerableTimer <= 0 && checkCollision(
          { x: player.x, y: player.y, width: player.width, height: player.height },
          { x: p.x, y: p.y, width: p.width, height: p.height }
      )) {
          player.hp -= 1;
          player.invulnerableTimer = 60; 
          player.vx = -12;
          player.vy = -6;
          player.isGrounded = false;
          state.projectiles.splice(i, 1);
          if (player.hp <= 0) { onGameOver(); return; }
          continue;
      }
      if (p.x < state.cameraX - 100 || p.y > canvasHeight + 100) { state.projectiles.splice(i, 1); }
  }

  if (player.invulnerableTimer > 0) { player.invulnerableTimer -= timeScale; }

  // --- SPEED LINES LOGIC ---
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
              isVertical: false, followPlayer: false
          });
      }
  }

  if (player.isBoosted) {
      if (Math.random() < 0.8 * timeScale) {
           const offsetX = (Math.random() * 60) - 30; 
           state.speedLines.push({
               id: Math.random().toString(),
               x: player.x + offsetX, y: player.y + Math.random() * 50 - 20, 
               length: 30 + Math.random() * 40, speed: 15 + Math.random() * 10, 
               opacity: 0.6 + Math.random() * 0.4, isVertical: true,
               followPlayer: true, offsetX: offsetX
           });
      }
  }

  for (let i = state.speedLines.length - 1; i >= 0; i--) {
      const line = state.speedLines[i];
      if (line.isVertical) {
          line.y += line.speed * timeScale; 
          line.opacity -= 0.08 * timeScale; 
          if (line.followPlayer) { line.x = player.x + (line.offsetX || 0); }
      } else {
          line.x += line.speed * timeScale; 
          line.opacity -= 0.05 * timeScale;
      }
      if (line.opacity <= 0) { state.speedLines.splice(i, 1); }
  }

  if (state.cameraX > state.maxCameraX) state.maxCameraX = state.cameraX;
  const leftTrigger = Math.min(350, canvasWidth * 0.4);
  const rightTrigger = Math.max(leftTrigger + 50, canvasWidth * 0.35);
  const playerScreenX = player.x - state.cameraX;
  let targetCamX = state.cameraX;
  if (playerScreenX > rightTrigger) { targetCamX = player.x - rightTrigger; } 
  else if (playerScreenX < leftTrigger) { targetCamX = player.x - leftTrigger; }
  const MAX_BACKTRACK_DISTANCE = 500;
  const minAllowedCamX = Math.max(0, state.maxCameraX - MAX_BACKTRACK_DISTANCE);
  if (targetCamX < minAllowedCamX) targetCamX = minAllowedCamX;
  state.cameraX = targetCamX;
  if (player.x < state.cameraX) { player.x = state.cameraX; player.vx = 0; }
  if (player.y > canvasHeight + 100) onGameOver();
  if (player.x > LEVEL2_CONFIG.LEVEL_LENGTH + 200) onComplete();
  
  // Уменьшение кулдауна реплик
  if (state.katyaSpeechCooldown > 0) state.katyaSpeechCooldown -= timeScale;

  state.gameTime += 1 * timeScale;
  state.wasScreaming = isScreaming; 
};
