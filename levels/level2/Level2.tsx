import React, { useRef, useEffect, useCallback, useState } from 'react';
import { LevelProps } from '../../types';
import { LEVEL2_CONFIG, BOSS_CONFIG } from './config';
import { Level2State } from './types';
import { updateLevel2 } from './physics';
import { drawLevel2 } from './render';
import { generateLevel } from './generator';
import { clearSpriteCache } from './render/utils';
import { SECRETARY_CONFIG } from './enemies/Secretary';

const Level2: React.FC<LevelProps> = ({ onGameOver, onComplete, isActive, startAtBoss }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef<number>(0);
  
  // HUD Refs
  const progressBarRef = useRef<HTMLDivElement>(null);
  const distanceTextRef = useRef<HTMLSpanElement>(null);
  const lastDistanceRef = useRef<number>(-1);
  const lastProgressRef = useRef<number>(-1);
  const volBarRef = useRef<HTMLDivElement>(null); // Volume visualizer
  const volLabelRef = useRef<HTMLSpanElement>(null); // "SCREAM" / "WAIT" label

  // React State
  const [playerHp, setPlayerHp] = useState(LEVEL2_CONFIG.PLAYER_MAX_HP);
  const lastHpRef = useRef(LEVEL2_CONFIG.PLAYER_MAX_HP);
  const [countdown, setCountdown] = useState<number | string | null>(null);
  const inputEnabled = useRef(false);
  const [micActive, setMicActive] = useState(false);
  const [showMicPrompt, setShowMicPrompt] = useState(true);

  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const currentVolumeRef = useRef<number>(0);

  const stateRef = useRef<Level2State>({
      player: {
          x: 50, y: 0, vx: 0, vy: 0,
          width: LEVEL2_CONFIG.PLAYER_WIDTH,
          height: LEVEL2_CONFIG.PLAYER_HEIGHT,
          hp: LEVEL2_CONFIG.PLAYER_MAX_HP,
          invulnerableTimer: 0,
          isGrounded: false, isJumping: false, isBoosted: false, facingRight: true, frameTimer: 0,
          currentPlatformType: null
      },
      platforms: [],
      decorations: [],
      enemies: [],
      boss: null,
      projectiles: [],
      lastEnemySpawnX: 0,
      backgroundElements: [],
      speedLines: [],
      cameraX: 0,
      maxCameraX: 0,
      score: 0,
      gameTime: 0,
      levelLength: LEVEL2_CONFIG.LEVEL_LENGTH,
      wasScreaming: false
  });

  // AUDIO SETUP
  const startMic = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const analyser = audioCtx.createAnalyser();
          const source = audioCtx.createMediaStreamSource(stream);
          
          analyser.fftSize = 64; // Small bin size for faster processing
          source.connect(analyser);
          
          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;
          dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
          
          setMicActive(true);
          setShowMicPrompt(false);
          
          // Resume context if suspended (browser policy)
          if (audioCtx.state === 'suspended') {
              await audioCtx.resume();
          }
      } catch (err) {
          console.error("Mic access denied:", err);
          alert("Microphone access is required to defeat the boss! Please enable it.");
      }
  };

  // Инициализация
  useEffect(() => {
      const { platforms, decorations, background } = generateLevel();
      stateRef.current.platforms = platforms;
      stateRef.current.decorations = decorations;
      stateRef.current.backgroundElements = background;
      stateRef.current.enemies = []; 
      stateRef.current.projectiles = [];
      stateRef.current.lastEnemySpawnX = 0;
      stateRef.current.player.hp = LEVEL2_CONFIG.PLAYER_MAX_HP;
      stateRef.current.player.invulnerableTimer = 0;
      stateRef.current.wasScreaming = false;
      setPlayerHp(LEVEL2_CONFIG.PLAYER_MAX_HP);
      lastHpRef.current = LEVEL2_CONFIG.PLAYER_MAX_HP;
      
      const floorY = window.innerHeight - LEVEL2_CONFIG.FLOOR_HEIGHT;
      
      if (startAtBoss) {
          const bossX = LEVEL2_CONFIG.LEVEL_LENGTH - 100 - SECRETARY_CONFIG.WIDTH;
          const spawnX = bossX - 600; // 600px before boss
          stateRef.current.player.x = spawnX;
          stateRef.current.player.y = floorY - LEVEL2_CONFIG.PLAYER_HEIGHT;
          stateRef.current.cameraX = spawnX - 200;
          stateRef.current.maxCameraX = spawnX - 200;
      } else {
          stateRef.current.player.x = 50;
          stateRef.current.player.y = floorY - LEVEL2_CONFIG.PLAYER_HEIGHT;
          stateRef.current.cameraX = 0;
          stateRef.current.maxCameraX = 0;
      }

      // BOSS INIT
      const bossX = LEVEL2_CONFIG.LEVEL_LENGTH - 100 - SECRETARY_CONFIG.WIDTH;
      stateRef.current.boss = {
          x: bossX,
          y: floorY - SECRETARY_CONFIG.HEIGHT + 10, 
          width: SECRETARY_CONFIG.WIDTH,
          height: SECRETARY_CONFIG.HEIGHT,
          variant: 0, 
          frameTimer: 0,
          attackTimer: 0,
          timeToNextAttack: 120,
          // HP
          hp: BOSS_CONFIG.HP,
          maxHp: BOSS_CONFIG.HP,
          invulnerableTimer: 0,
          damagedTimer: 0
      };

      lastTimeRef.current = 0;

      // HUD Reset
      if (distanceTextRef.current) {
          const dist = startAtBoss ? 600 : LEVEL2_CONFIG.LEVEL_LENGTH;
          distanceTextRef.current.textContent = Math.floor(dist / 10).toString();
      }
      if (progressBarRef.current) {
          const progress = startAtBoss ? 95 : 0;
          progressBarRef.current.style.width = `${progress}%`;
      }
      if (volBarRef.current) volBarRef.current.style.height = '0%';

      const handleKeyDown = (e: KeyboardEvent) => keysRef.current.add(e.key);
      const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
          clearSpriteCache();
          
          if (audioContextRef.current) {
              audioContextRef.current.close();
          }
      };
  }, [startAtBoss]);

  const loop = useCallback(() => {
      if (!isActive) return;
      const now = performance.now();
      const canvas = canvasRef.current;
      if (!canvas) {
          requestRef.current = requestAnimationFrame(loop);
          return;
      }
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      if (!lastTimeRef.current) lastTimeRef.current = now;
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;

      const timeScale = dt / (1000 / 60);
      const cappedTimeScale = Math.min(timeScale, 4.0); 

      // --- MIC PROCESSING ---
      let isScreaming = false;
      let vol = 0;
      if (analyserRef.current && dataArrayRef.current) {
          // Fix: Cast to any to bypass Strict Uint8Array mismatch in some TS environments
          analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
          // Simple average volume
          const sum = dataArrayRef.current.reduce((a, b) => a + b, 0);
          const avg = sum / dataArrayRef.current.length;
          currentVolumeRef.current = avg;
          vol = avg;

          if (avg > BOSS_CONFIG.MIC_THRESHOLD) {
              isScreaming = true;
          }
      }

      // Update Vol Bar UI
      if (volBarRef.current) {
          const boss = stateRef.current.boss;
          const cooldownMax = BOSS_CONFIG.DAMAGE_COOLDOWN;
          const currentCooldown = boss ? boss.invulnerableTimer : 0;

          if (currentCooldown > 0) {
              // --- COOLDOWN VISUALIZATION ---
              // Scale moves from 100% to 0% based on remaining time
              const progress = currentCooldown / cooldownMax; // 1.0 -> 0.0
              const visualHeight = progress * 100;
              
              // Color transition: Red (0) -> Orange -> Yellow -> Green (120)
              // As progress goes 1.0 -> 0.0, Hue should go 0 -> 120
              const hue = (1 - progress) * 120;
              
              volBarRef.current.style.height = `${visualHeight}%`;
              volBarRef.current.style.backgroundColor = `hsl(${hue}, 90%, 50%)`;
              volBarRef.current.style.boxShadow = `0 0 10px hsl(${hue}, 90%, 50%)`;
              
              if (volLabelRef.current) {
                  volLabelRef.current.textContent = 'WAIT';
                  volLabelRef.current.style.color = `hsl(${hue}, 90%, 50%)`;
              }
          } else {
              // --- ACTIVE MODE ---
              // Normalize 0-255 to 0-100%, clamped
              const visualHeight = Math.min(100, (vol / 60) * 100); 
              volBarRef.current.style.height = `${visualHeight}%`;
              
              if (isScreaming) {
                  volBarRef.current.style.backgroundColor = '#ef4444'; // Red when screaming
                  volBarRef.current.style.boxShadow = '0 0 15px #ef4444';
              } else {
                  volBarRef.current.style.backgroundColor = '#22c55e'; // Green otherwise
                  volBarRef.current.style.boxShadow = 'none';
              }
              
              if (volLabelRef.current) {
                  volLabelRef.current.textContent = 'SCREAM';
                  volLabelRef.current.style.color = 'rgba(255,255,255,0.5)';
              }
          }
      }

      const activeKeys = inputEnabled.current ? keysRef.current : new Set<string>();

      updateLevel2(
          stateRef.current, 
          activeKeys, 
          isScreaming,
          cappedTimeScale,
          canvas.width, 
          canvas.height,
          () => onGameOver(stateRef.current.score),
          () => onComplete(stateRef.current.score + 5000, stateRef.current.gameTime / 60)
      );
      
      if (stateRef.current.player.hp !== lastHpRef.current) {
          lastHpRef.current = stateRef.current.player.hp;
          setPlayerHp(stateRef.current.player.hp);
      }

      if (progressBarRef.current || distanceTextRef.current) {
          const currentX = stateRef.current.player.x;
          const totalDist = LEVEL2_CONFIG.LEVEL_LENGTH;
          
          if (progressBarRef.current) {
              const progress = Math.max(0, Math.min(100, (currentX / totalDist) * 100));
              if (Math.abs(progress - lastProgressRef.current) > 0.2) {
                  progressBarRef.current.style.width = `${progress}%`;
                  lastProgressRef.current = progress;
              }
          }
          if (distanceTextRef.current) {
              const remainingPixels = Math.max(0, totalDist - currentX);
              const dist = Math.floor(remainingPixels / 10);
              if (dist !== lastDistanceRef.current) {
                  distanceTextRef.current.textContent = dist.toString();
                  lastDistanceRef.current = dist;
              }
          }
      }

      drawLevel2(ctx, stateRef.current, canvas.width, canvas.height);

      // Draw Boss HUD if nearby
      if (stateRef.current.boss && stateRef.current.boss.x - stateRef.current.cameraX < canvas.width) {
         // HP Bar for Boss
         const b = stateRef.current.boss;
         const barW = 300;
         const barH = 20;
         const bx = (canvas.width - barW) / 2;
         const by = 80;
         
         ctx.save();
         // BG
         ctx.fillStyle = 'rgba(0,0,0,0.5)';
         ctx.fillRect(bx, by, barW, barH);
         // Fill
         ctx.fillStyle = '#ef4444';
         const hpPct = b.hp / b.maxHp;
         ctx.fillRect(bx, by, barW * hpPct, barH);
         // Border
         ctx.strokeStyle = '#fff';
         ctx.lineWidth = 2;
         ctx.strokeRect(bx, by, barW, barH);
         
         // Label
         ctx.fillStyle = '#fff';
         ctx.font = 'bold 16px Orbitron';
         ctx.textAlign = 'center';
         ctx.fillText('ANGRY BOSS', canvas.width/2, by - 10);
         
         // Damage flash
         if (b.damagedTimer > 0) {
             ctx.fillStyle = 'rgba(255,255,255,0.2)';
             ctx.fillRect(0,0, canvas.width, canvas.height);
         }
         ctx.restore();
      }

      requestRef.current = requestAnimationFrame(loop);
  }, [isActive, onGameOver, onComplete]);

  // Initial Countdown
  useEffect(() => {
      if (isActive) {
          inputEnabled.current = false;
          lastTimeRef.current = 0;
          
          requestRef.current = requestAnimationFrame(loop);

          // We wait until mic is active OR user dismisses it? 
          // Actually, we can just run the countdown anyway, but show overlay
          
          const SHUTTER_DELAY = 1200;
          let intervalId: ReturnType<typeof setInterval>;

          const timeoutId = setTimeout(() => {
              let count = 3;
              setCountdown(count);

              intervalId = setInterval(() => {
                  count--;
                  if (count > 0) {
                      setCountdown(count);
                  } else if (count === 0) {
                      setCountdown('GO!');
                      inputEnabled.current = true;
                  } else {
                      clearInterval(intervalId);
                      setCountdown(null);
                  }
              }, 600);
          }, SHUTTER_DELAY);

          return () => {
              if (requestRef.current) cancelAnimationFrame(requestRef.current);
              clearTimeout(timeoutId);
              clearInterval(intervalId);
          };
      }
  }, [isActive, loop]);

  return (
    <div className="relative w-full h-full bg-slate-300">
        
        {/* MIC PROMPT OVERLAY */}
        {isActive && showMicPrompt && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="bg-slate-900 border border-pink-500 p-8 rounded-2xl flex flex-col items-center text-center max-w-md">
                    <h2 className="text-3xl font-orbitron font-bold text-white mb-4">BOSS BATTLE</h2>
                    <p className="text-slate-300 mb-8 font-inter">
                        To defeat the boss, you must <strong>SCREAM</strong> into your microphone!<br/><br/>
                        Enable microphone access to continue.
                    </p>
                    <button 
                        onClick={startMic}
                        className="px-8 py-4 bg-pink-600 hover:bg-pink-500 text-white font-bold font-orbitron rounded-xl shadow-[0_0_20px_rgba(236,72,153,0.4)] animate-pulse transition-all transform hover:scale-105"
                    >
                        ENABLE MICROPHONE
                    </button>
                    <button 
                         onClick={() => setShowMicPrompt(false)}
                         className="mt-4 text-xs text-slate-500 hover:text-white underline"
                    >
                        Continue without Mic (You will lose)
                    </button>
                </div>
            </div>
        )}

        {/* HUD */}
        {isActive && (
            <div className="absolute top-0 left-0 w-full h-8 z-30 bg-black/60 backdrop-blur-md border-b border-white/10 flex items-center px-3 md:px-5 overflow-hidden">
                <div 
                    ref={progressBarRef}
                    className="absolute top-0 left-0 h-full bg-pink-600/20 shadow-[inset_0_0_10px_rgba(236,72,153,0.2)] transition-[width] duration-75 ease-linear"
                    style={{ width: '0%' }}
                >
                    <div className="absolute top-0 right-0 w-0.5 h-full bg-pink-400 shadow-[0_0_8px_#ec4899]" />
                </div>

                <div className="relative w-full flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-pink-500 text-[8px] font-bold uppercase tracking-widest bg-pink-500/15 px-1 rounded border border-pink-500/20 leading-none py-0.5">M01</span>
                            <span className="text-white font-orbitron font-bold text-[9px] md:text-[10px] uppercase tracking-tight">Office Rush</span>
                        </div>
                        {/* HP INDICATOR */}
                        <div className="flex gap-1 ml-2">
                            {[...Array(LEVEL2_CONFIG.PLAYER_MAX_HP)].map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`w-3 h-3 md:w-4 md:h-4 transform rotate-45 border border-black/50 ${i < playerHp ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-slate-700 opacity-50'}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 min-w-[100px] sm:min-w-[180px]">
                        <span className="text-pink-500 text-[8px] font-bold uppercase tracking-widest opacity-80 hidden sm:inline whitespace-nowrap">Осталось:</span>
                        <div className="w-14 sm:w-16 text-right">
                            <p className="text-base md:text-lg font-orbitron font-black text-white tabular-nums leading-none">
                                <span ref={distanceTextRef}>{LEVEL2_CONFIG.LEVEL_LENGTH / 10}</span>
                                <span className="text-[8px] ml-0.5 text-pink-500/80 tracking-normal">М</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* VOLUME METER HUD */}
        {isActive && micActive && (
            <div className="absolute right-4 bottom-20 w-8 h-48 bg-black/50 border border-white/20 rounded-full overflow-hidden z-20 flex flex-col justify-end p-1">
                <div 
                    ref={volBarRef}
                    className="w-full bg-green-500 rounded-full transition-[height,background-color] duration-75 ease-out"
                    style={{ height: '0%' }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <span 
                        ref={volLabelRef}
                        className="text-[10px] text-white/50 font-orbitron -rotate-90 whitespace-nowrap"
                     >
                        SCREAM
                     </span>
                </div>
                {/* Threshold Line */}
                <div 
                    className="absolute w-full h-0.5 bg-white/50 left-0" 
                    style={{ bottom: `${(BOSS_CONFIG.MIC_THRESHOLD / 60) * 100}%` }}
                />
            </div>
        )}

        <canvas 
            ref={canvasRef}
            width={window.innerWidth}
            height={window.innerHeight}
            className="block"
            style={{ transform: 'translateZ(0)' }} 
        />
        
        {countdown !== null && (
            <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
            <div key={countdown} className="animate-countdown text-8xl md:text-9xl font-orbitron font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]">
                {countdown}
            </div>
            </div>
        )}
    </div>
  );
};

export default Level2;