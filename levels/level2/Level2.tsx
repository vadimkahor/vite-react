
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { LevelProps } from '../../types';
import { LEVEL2_CONFIG, BOSS_CONFIG } from './config';
import { Level2State } from './types';
import { updateLevel2 } from './physics';
import { drawLevel2 } from './render';
import { generateLevel } from './generator';
import { clearSpriteCache } from './render/utils';
import { SECRETARY_CONFIG } from './enemies/Secretary';

const Level2: React.FC<LevelProps> = ({ onGameOver, onComplete, isActive, startAtBoss, isGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef<number>(0);
  
  // Guard to ensure intro sequence logic runs only once per level mount
  const introStarted = useRef(false);
  
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
  const [fallbackMode, setFallbackMode] = useState(false); // New: Fallback if mic fails
  
  // Show prompt only when approaching boss, not at start
  const [showMicPrompt, setShowMicPrompt] = useState(false);
  const bossPromptTriggered = useRef(false);

  // Dialogue State
  const [bossDialogueStep, setBossDialogueStep] = useState<number>(-1);
  const dialogueTimerRef = useRef<number>(0);

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
      shake: { x: 0, y: 0 },
      score: 0,
      gameTime: 0,
      levelLength: LEVEL2_CONFIG.LEVEL_LENGTH,
      wasScreaming: false,
      introMessage: undefined,
      lastKatyaPhrase: undefined,
      lastGuardPhrase: undefined,
      katyaSpeechCooldown: 0
  });

  const triggerCountdown = () => {
      let count = 3;
      setCountdown(count);

      const intervalId = setInterval(() => {
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
  };

  // AUDIO SETUP
  const startMic = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setFallbackMode(true);
          setShowMicPrompt(false);
          inputEnabled.current = false;
          triggerCountdown();
          return;
      }

      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const analyser = audioCtx.createAnalyser();
          const source = audioCtx.createMediaStreamSource(stream);
          
          analyser.fftSize = 64; 
          source.connect(analyser);
          
          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;
          dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
          
          setMicActive(true);
          setShowMicPrompt(false);
          
          inputEnabled.current = false;
          triggerCountdown();
          
          if (audioCtx.state === 'suspended') {
              await audioCtx.resume();
          }
      } catch (err) {
          setFallbackMode(true);
          setShowMicPrompt(false);
          inputEnabled.current = false;
          triggerCountdown();
      }
  };

  const enableFallback = () => {
      setFallbackMode(true);
      setShowMicPrompt(false);
      inputEnabled.current = false;
      triggerCountdown();
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
      stateRef.current.player.hp = LEVEL2_CONFIG.PLAYER_MAX_HP,
      stateRef.current.player.invulnerableTimer = 0;
      stateRef.current.wasScreaming = false;
      stateRef.current.introMessage = undefined;
      stateRef.current.lastKatyaPhrase = undefined;
      stateRef.current.lastGuardPhrase = undefined;
      stateRef.current.katyaSpeechCooldown = 0;
      stateRef.current.shake = { x: 0, y: 0 };
      setPlayerHp(LEVEL2_CONFIG.PLAYER_MAX_HP);
      lastHpRef.current = LEVEL2_CONFIG.PLAYER_MAX_HP;
      
      bossPromptTriggered.current = false;
      setShowMicPrompt(false);
      setMicActive(false);
      setFallbackMode(false);
      introStarted.current = false;
      setBossDialogueStep(-1);
      dialogueTimerRef.current = 0;

      const floorY = window.innerHeight - LEVEL2_CONFIG.FLOOR_HEIGHT;
      
      if (startAtBoss) {
          const bossX = LEVEL2_CONFIG.LEVEL_LENGTH - 100 - SECRETARY_CONFIG.WIDTH;
          const spawnX = bossX - 450; 
          stateRef.current.player.x = spawnX;
          stateRef.current.player.y = floorY - LEVEL2_CONFIG.PLAYER_HEIGHT;
          stateRef.current.cameraX = spawnX - 200;
          stateRef.current.maxCameraX = spawnX - 200;
      } else {
          stateRef.current.player.x = 50;
          stateRef.current.player.y = floorY - LEVEL2_CONFIG.PLAYER_HEIGHT;
          stateRef.current.cameraX = 0;
          stateRef.current.maxCameraX = 0;
          
          stateRef.current.introMessage = {
              active: true,
              text: "Нужно как-то выбраться из офиса и не\nпопасться на глаза службе безопасности...",
              opacity: 0,
              timer: 0,
              phase: 'fadein'
          };
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
          hp: BOSS_CONFIG.HP,
          maxHp: BOSS_CONFIG.HP,
          invulnerableTimer: 0,
          damagedTimer: 0
      };

      lastTimeRef.current = 0;

      const handleKeyDown = (e: KeyboardEvent) => keysRef.current.add(e.key);
      const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
          clearSpriteCache();
          if (audioContextRef.current) audioContextRef.current.close();
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

      // --- INTRO BUBBLE LOGIC ---
      if (stateRef.current.introMessage?.active) {
          const msg = stateRef.current.introMessage;
          const dtSeconds = dt / 1000;
          if (msg.phase === 'fadein') {
              msg.opacity += dtSeconds * 2;
              if (msg.opacity >= 1) { msg.opacity = 1; msg.phase = 'hold'; msg.timer = 3.0; }
          } else if (msg.phase === 'hold') {
              msg.timer -= dtSeconds;
              if (msg.timer <= 0) msg.phase = 'fadeout';
          } else if (msg.phase === 'fadeout') {
              msg.opacity -= dtSeconds * 2;
              if (msg.opacity <= 0) { msg.opacity = 0; msg.active = false; }
          }
      }

      // --- INPUT PROCESSING ---
      let isScreaming = false;
      let vol = 0;
      if (fallbackMode) {
          if (keysRef.current.has(' ')) { isScreaming = true; vol = 80 + Math.random() * 20; }
      } else if (micActive && analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
          const sum = dataArrayRef.current.reduce((a, b) => a + b, 0);
          const avg = sum / dataArrayRef.current.length;
          currentVolumeRef.current = avg; vol = avg;
          if (avg > BOSS_CONFIG.MIC_THRESHOLD) isScreaming = true;
      }

      // Update Vol Bar UI
      if (volBarRef.current) {
          const boss = stateRef.current.boss;
          const cooldownMax = BOSS_CONFIG.DAMAGE_COOLDOWN;
          const currentCooldown = boss ? boss.invulnerableTimer : 0;
          if (currentCooldown > 0) {
              const progress = currentCooldown / cooldownMax;
              volBarRef.current.style.height = `${progress * 100}%`;
              const hue = (1 - progress) * 120;
              volBarRef.current.style.backgroundColor = `hsl(${hue}, 90%, 50%)`;
              if (volLabelRef.current) volLabelRef.current.textContent = 'WAIT';
          } else {
              volBarRef.current.style.height = `${Math.min(100, (vol / 60) * 100)}%`;
              volBarRef.current.style.backgroundColor = isScreaming ? '#ef4444' : '#22c55e';
              if (volLabelRef.current) volLabelRef.current.textContent = fallbackMode ? 'SPACE' : 'SCREAM';
          }
      }

      // --- BOSS DIALOGUE TRIGGER ---
      if (!bossPromptTriggered.current && stateRef.current.boss) {
          const distToBoss = stateRef.current.boss.x - stateRef.current.player.x;
          if (distToBoss < 500 && bossDialogueStep === -1) {
              setBossDialogueStep(0);
              dialogueTimerRef.current = 150; 
          }
      }

      // --- DIALOGUE SEQUENCE LOGIC ---
      const isDialogueActive = bossDialogueStep >= 0 && bossDialogueStep <= 7;
      if (isDialogueActive) {
          dialogueTimerRef.current -= cappedTimeScale;
          
          const boss = stateRef.current.boss;
          const player = stateRef.current.player;

          // Установка реплик ОДИН РАЗ за шаг
          if (dialogueTimerRef.current > 145) {
              if (boss) boss.speechBubble = undefined;
              player.activeBubble = undefined;

              if (bossDialogueStep === 0 && boss) {
                  boss.speechBubble = { text: "Екатерина Борисовна, куда это вы собрались?", timer: 130, maxTimer: 130 };
              } else if (bossDialogueStep === 1 && boss) {
                  boss.speechBubble = { text: "Я жду от вас отчет по форме Г-420-666", timer: 130, maxTimer: 130 };
              } else if (bossDialogueStep === 2) {
                  player.activeBubble = { text: "Виктория, мне нужно идти...", timer: 130, maxTimer: 130 };
              } else if (bossDialogueStep === 3 && boss) {
                  boss.speechBubble = { text: "Заполните эти бумаги в 32 экземплярах!", timer: 130, maxTimer: 130 };
              } else if (bossDialogueStep === 4 && boss) {
                  boss.speechBubble = { text: "А еще я опять потеряла ваши документы", timer: 130, maxTimer: 130 };
              } else if (bossDialogueStep === 5 && boss) {
                  boss.speechBubble = { text: "Пришлите сканы на мою рабочую почту", timer: 130, maxTimer: 130 };
              } else if (bossDialogueStep === 6 && boss) {
                  boss.speechBubble = { text: "И не забудьте передать курьером ксерокопии", timer: 130, maxTimer: 130 };
              } else if (bossDialogueStep === 7) {
                  player.activeBubble = { text: "ХВАТИТ!!!", timer: 130, maxTimer: 130 };
              }
          }

          // SCREEN SHAKE ON SCREAM
          if (bossDialogueStep === 7) {
              stateRef.current.shake = {
                  x: (Math.random() - 0.5) * 12,
                  y: (Math.random() - 0.5) * 12
              };
          } else {
              stateRef.current.shake = { x: 0, y: 0 };
          }

          // Обновление таймеров реплик (только во время диалога, в игре это делает physics.ts)
          if (boss?.speechBubble) {
              boss.speechBubble.timer -= cappedTimeScale;
              if (boss.speechBubble.timer <= 0) boss.speechBubble = undefined;
          }
          if (player.activeBubble) {
              player.activeBubble.timer -= cappedTimeScale;
              if (player.activeBubble.timer <= 0) player.activeBubble = undefined;
          }

          // Переход на следующий шаг
          if (dialogueTimerRef.current <= 0) {
              if (bossDialogueStep < 7) {
                  setBossDialogueStep(prev => prev + 1);
                  dialogueTimerRef.current = 150;
              } else {
                  setBossDialogueStep(8);
                  setShowMicPrompt(true);
                  bossPromptTriggered.current = true;
                  stateRef.current.shake = { x: 0, y: 0 };
              }
          }
      } else {
          // Reset shake when dialogue is over or not active
          stateRef.current.shake = { x: 0, y: 0 };
      }

      const activeKeys = (inputEnabled.current && !isGameOver && !isDialogueActive) ? keysRef.current : new Set<string>();

      if (!showMicPrompt && !isDialogueActive) {
          updateLevel2(
              stateRef.current, 
              activeKeys, 
              isScreaming,
              inputEnabled.current, 
              bossPromptTriggered.current, 
              cappedTimeScale,
              canvas.width, 
              canvas.height,
              () => onGameOver(stateRef.current.score),
              () => onComplete(stateRef.current.score + 5000, stateRef.current.gameTime / 60)
          );
      }
      
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
              const dist = Math.floor(Math.max(0, totalDist - currentX) / 10);
              if (dist !== lastDistanceRef.current) {
                  distanceTextRef.current.textContent = dist.toString();
                  lastDistanceRef.current = dist;
              }
          }
      }

      drawLevel2(ctx, stateRef.current, canvas.width, canvas.height);

      // Boss HUD
      if (stateRef.current.boss && !showMicPrompt && bossPromptTriggered.current && bossDialogueStep >= 8) {
         const b = stateRef.current.boss;
         if (b.x - stateRef.current.cameraX < canvas.width + 400) {
             const barW = 450; const barH = 20; const bx = (canvas.width - barW) / 2; const by = 380;
             ctx.save();
             ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px Orbitron'; ctx.textAlign = 'center';
             ctx.fillText('СТАЖЕР ВИКТОРИЯ', bx + barW / 2, by - 12);
             ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(bx, by, barW, barH);
             ctx.fillStyle = '#ef4444'; ctx.fillRect(bx, by, barW * Math.max(0, b.hp / b.maxHp), barH);
             ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, barW, barH);
             if (b.damagedTimer > 0) { ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(0,0, canvas.width, canvas.height); }
             ctx.restore();
         }
      }

      requestRef.current = requestAnimationFrame(loop);
  }, [isActive, onGameOver, onComplete, showMicPrompt, micActive, fallbackMode, startAtBoss, isGameOver, bossDialogueStep]);

  useEffect(() => {
      if (isActive) requestRef.current = requestAnimationFrame(loop);
      return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isActive, loop]);

  useEffect(() => {
      if (isActive && !introStarted.current) {
          introStarted.current = true;
          inputEnabled.current = false;
          lastTimeRef.current = 0;
          setTimeout(() => triggerCountdown(), 1200);
      }
  }, [isActive]);

  return (
    <div className="relative w-full h-full bg-slate-300">
        {isActive && showMicPrompt && !isGameOver && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="bg-slate-900 border border-pink-500 p-8 rounded-2xl flex flex-col items-center text-center max-w-md animate-in zoom-in duration-300">
                    <h2 className="text-3xl font-orbitron font-bold text-white mb-4">BOSS BATTLE</h2>
                    <p className="text-slate-300 mb-8 font-inter">
                        Используй микрофон и <strong>КРИЧИ РУГАТЕЛЬСТВА</strong> чтобы победить Викторию!
                    </p>
                    <button onClick={startMic} className="px-8 py-4 bg-pink-600 hover:bg-pink-500 text-white font-bold font-orbitron rounded-xl shadow-[0_0_20px_rgba(236,72,153,0.4)] animate-pulse transition-all transform hover:scale-105">Включить микрофон</button>
                    <button onClick={enableFallback} className="mt-4 text-xs text-slate-500 hover:text-white underline">Микрофона нет, буду нажимать «Пробел»</button>
                </div>
            </div>
        )}

        {isActive && !isGameOver && (
            <div className="absolute top-0 left-0 w-full h-8 z-30 bg-black/60 backdrop-blur-md border-b border-white/10 flex items-center px-3 md:px-5 overflow-hidden">
                <div ref={progressBarRef} className="absolute top-0 left-0 h-full bg-pink-600/20 shadow-[inset_0_0_10px_rgba(236,72,153,0.2)] transition-[width] duration-75 ease-linear" style={{ width: '0%' }}><div className="absolute top-0 right-0 w-0.5 h-full bg-pink-400 shadow-[0_0_8px_#ec4899]" /></div>
                <div className="relative w-full flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2"><span className="text-pink-500 text-[8px] font-bold uppercase tracking-widest bg-pink-500/15 px-1 rounded border border-pink-500/20 leading-none py-0.5">M01</span><span className="text-white font-orbitron font-bold text-[9px] md:text-[10px] uppercase tracking-tight">ПОБЕГ ИЗ ОФИСА</span></div>
                        <div className="flex gap-1 ml-2">{[...Array(LEVEL2_CONFIG.PLAYER_MAX_HP)].map((_, i) => (<div key={i} className={`w-3 h-3 md:w-4 md:h-4 transform rotate-45 border border-black/50 ${i < playerHp ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-slate-700 opacity-50'}`} />))}</div>
                    </div>
                    <div className="flex items-center justify-end gap-2 min-w-[100px] sm:min-w-[180px]"><span className="text-pink-500 text-[8px] font-bold uppercase tracking-widest opacity-80 hidden sm:inline whitespace-nowrap">Осталось:</span><div className="w-14 sm:w-16 text-right"><p className="text-base md:text-lg font-orbitron font-black text-white tabular-nums leading-none"><span ref={distanceTextRef}>{LEVEL2_CONFIG.LEVEL_LENGTH / 10}</span><span className="text-[8px] ml-0.5 text-pink-500/80 tracking-normal">М</span></p></div></div>
                </div>
            </div>
        )}

        {isActive && (micActive || fallbackMode) && !isGameOver && (
            <div className="absolute right-4 bottom-20 w-8 h-48 bg-black/50 border border-white/20 rounded-full overflow-hidden z-20 flex flex-col justify-end p-1">
                <div ref={volBarRef} className="w-full bg-green-500 rounded-full transition-[height,background-color] duration-75 ease-out" style={{ height: '0%' }} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span ref={volLabelRef} className="text-[10px] text-white/50 font-orbitron -rotate-90 whitespace-nowrap">{fallbackMode ? 'SPACE' : 'SCREAM'}</span></div>
                <div className="absolute w-full h-0.5 bg-white/50 left-0" style={{ bottom: `${(BOSS_CONFIG.MIC_THRESHOLD / 60) * 100}%` }} />
            </div>
        )}
        <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} className="block" style={{ transform: 'translateZ(0)' }} />
        {countdown !== null && (
            <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
            <div key={countdown} className="animate-countdown text-8xl md:text-9xl font-orbitron font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]">{countdown}</div>
            </div>
        )}
    </div>
  );
};

export default Level2;
