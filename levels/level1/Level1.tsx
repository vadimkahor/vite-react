
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { LEVEL1_CONFIG } from './config';
import { LevelProps } from '../../types';
import { GameRefs, Particle } from './types';
import { updateGame } from './physics';
import { drawScene } from './render';

const Level1: React.FC<LevelProps> = ({ onGameOver, onComplete, isActive, isGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  
  // ОПТИМИЗАЦИЯ HUD: Используем Ref для прямого обновления DOM без ре-рендеров React
  const distanceTextRef = useRef<HTMLParagraphElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  // OPTIMIZATION: Throttle DOM updates
  const lastDistanceRef = useRef<number>(-1);
  const lastProgressRef = useRef<number>(-1);
  
  const [countdown, setCountdown] = useState<number | string | null>(null);
  
  // Флаг запуска цикла.
  const isLoopRunning = useRef(false);

  // --- ИНИЦИАЛИЗАЦИЯ REFS (ВСЕ СОСТОЯНИЕ ИГРЫ) ---
  const refsRef = useRef<GameRefs>({
    canvas: null as any, 
    keys: new Set(),
    player: {
      id: 'player',
      x: (LEVEL1_CONFIG.ROAD_WIDTH / 2) - (LEVEL1_CONFIG.PLAYER_WIDTH / 2),
      y: 0,
      width: LEVEL1_CONFIG.PLAYER_WIDTH,
      height: LEVEL1_CONFIG.PLAYER_HEIGHT,
      speed: 0,
      color: LEVEL1_CONFIG.COLORS.PLAYER,
      type: 'player'
    },
    traffic: [],
    speedLines: [],
    floatingMessages: [],
    skidMarks: [], 
    // ОПТИМИЗАЦИЯ: Пул объектов для частиц (200 штук)
    particles: Array.from({ length: 200 }, () => ({
        active: false,
        id: '',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 0,
        life: 0
    })),
    brakingDuration: 0,
    burnoutTimer: 0,
    turnDuration: 0,
    gameState: {
      score: 0,
      distance: 0,
      playerSpeed: LEVEL1_CONFIG.INITIAL_SPEED,
      baseTrafficSpeed: LEVEL1_CONFIG.TRAFFIC_BASE_SPEED, 
    },
    timeElapsed: 0,
    playerVelocityX: 0,
    roadOffset: 0,
    environmentOffset: 0,
    snowCache: null, // Инициализация кэша
    currentSnowAmplitude: 4, 
    spawnTimer: 0,
    shake: { x: 0, y: 0 },
    nearMissCooldowns: new Set(),
    nearMissHistory: [],
    wallBumpCooldown: 0,
    wallBumpHistory: [],
    playerCurrentLane: 1,
    laneStabilityTimer: 0,
    lastSpawnedLane: -1,
    cameraOffset: -200, 
    engineIntensity: 0,
    isIntro: true,
    isOutro: false,
    outroExitOffset: 0,
    trafficSpawnDelay: 0
  });

  // --- ЛОГИКА ЗАПУСКА И СБРОСА ---
  useEffect(() => {
    if (isActive) {
      // Сбрасываем игру сразу при активации уровня
      resetGame();
      isLoopRunning.current = true;
      requestRef.current = requestAnimationFrame(loop);

      // Задержка перед таймером (ждем пока шторки откроются)
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
            // Передаем управление игроку
            refsRef.current.isIntro = false;
          } else {
            clearInterval(intervalId);
            setCountdown(null);
          }
        }, 600);
      }, SHUTTER_DELAY);
      
      return () => {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
        isLoopRunning.current = false;
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
      };
    }
  }, [isActive]);

  const resetGame = () => {
    const refs = refsRef.current;
    if (!refs.canvas) return;

    refs.traffic = [];
    refs.speedLines = [];
    refs.floatingMessages = [];
    refs.skidMarks = [];
    
    // Сброс частиц (деактивация)
    refs.particles.forEach(p => p.active = false);

    refs.brakingDuration = 0;
    refs.burnoutTimer = 0;
    refs.turnDuration = 0;
    refs.nearMissCooldowns.clear();
    refs.nearMissHistory = [];
    refs.wallBumpHistory = [];
    refs.wallBumpCooldown = 0;
    refs.playerVelocityX = 0;
    refs.spawnTimer = 0;
    refs.laneStabilityTimer = 0;
    
    // Начальное состояние для анимации въезда
    refs.cameraOffset = -300; 
    refs.isIntro = true;      
    refs.isOutro = false;
    refs.outroExitOffset = 0;
    refs.trafficSpawnDelay = 180; 

    refs.engineIntensity = 0;
    refs.environmentOffset = 0;
    refs.currentSnowAmplitude = 4; 
    refs.timeElapsed = 0; // Сброс времени
    
    // ВАЖНО: Сбрасываем таймер в 0
    lastTimeRef.current = 0;
    lastDistanceRef.current = -1;
    lastProgressRef.current = -1;
    
    refs.gameState = {
      score: 0,
      distance: 0,
      playerSpeed: LEVEL1_CONFIG.INITIAL_SPEED,
      baseTrafficSpeed: LEVEL1_CONFIG.TRAFFIC_BASE_SPEED, 
    };
    
    refs.player.x = (LEVEL1_CONFIG.ROAD_WIDTH / 2) - (LEVEL1_CONFIG.PLAYER_WIDTH / 2);
    refs.player.y = refs.canvas.height + 300; 
    
    // Сброс HUD
    if (distanceTextRef.current) distanceTextRef.current.textContent = Math.floor(LEVEL1_CONFIG.WIN_DISTANCE).toString();
    if (progressBarRef.current) progressBarRef.current.style.width = '0%';
  };

  // --- ОБРАБОТЧИКИ ВВОДА ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isGameOver) refsRef.current.keys.add(e.key);
    };
    const handleKeyUp = (e: KeyboardEvent) => refsRef.current.keys.delete(e.key);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isGameOver]);

  // --- ИГРОВОЙ ЦИКЛ (LOOP) ---
  const loop = useCallback(() => {
    if (!isLoopRunning.current) return;

    // Используем performance.now() для максимальной точности
    const now = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) {
        requestRef.current = requestAnimationFrame(loop);
        return;
    }
    
    if (refsRef.current.canvas !== canvas) {
        refsRef.current.canvas = canvas;
    }

    const ctx = canvas.getContext('2d', { alpha: false }); // alpha: false может помочь производительности
    if (ctx) {
      if (!lastTimeRef.current) {
          lastTimeRef.current = now;
      }
      
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      
      // Нормализация скорости: 1.0 = 60 FPS
      const timeScale = dt / (1000 / 60);
      const cappedTimeScale = Math.min(timeScale, 4.0); 

      // DISABLE KEYS IF GAME OVER
      if (isGameOver) {
          refsRef.current.keys.clear();
      }

      const isPlaying = updateGame(
          refsRef.current, 
          cappedTimeScale, 
          onGameOver, 
          onComplete
      );
      
      const currentDist = refsRef.current.gameState.distance;
      const remainingDistance = Math.ceil(Math.max(0, LEVEL1_CONFIG.WIN_DISTANCE - currentDist));
      
      if (distanceTextRef.current) {
          if (remainingDistance !== lastDistanceRef.current) {
              distanceTextRef.current.textContent = remainingDistance.toString();
              lastDistanceRef.current = remainingDistance;
          }
      }
      
      if (progressBarRef.current) {
          const progress = Math.min(100, (currentDist / LEVEL1_CONFIG.WIN_DISTANCE) * 100);
          if (Math.abs(progress - lastProgressRef.current) > 0.2) {
              progressBarRef.current.style.width = `${progress}%`;
              lastProgressRef.current = progress;
          }
      }

      drawScene(ctx, refsRef.current);

      if (!isPlaying) {
          isLoopRunning.current = false;
          return; 
      }
    }
    requestRef.current = requestAnimationFrame(loop);
  }, [onGameOver, onComplete, isGameOver]);

  return (
    <div className="relative w-full h-full">
      {/* HUD - Верхняя панель */}
      {isActive && !isGameOver && (
        <div className="absolute top-0 left-0 w-full h-8 z-30 bg-black/60 backdrop-blur-md border-b border-white/10 flex items-center px-3 md:px-5 overflow-hidden">
          <div 
            ref={progressBarRef}
            className="absolute top-0 left-0 h-full bg-pink-600/20 shadow-[inset_0_0_10px_rgba(236,72,153,0.2)] transition-[width] duration-75 ease-linear"
            style={{ width: '0%' }}
          >
            <div className="absolute top-0 right-0 w-0.5 h-full bg-pink-400 shadow-[0_0_8px_#ec4899]" />
          </div>

          <div className="relative w-full flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-pink-500 text-[8px] font-bold uppercase tracking-widest bg-pink-500/15 px-1 rounded border border-pink-500/20 leading-none py-0.5">M02</span>
              <span className="text-white font-orbitron font-bold text-[9px] md:text-[10px] uppercase tracking-tight">ГОНКИ ПО МКАД</span>
            </div>
            <div className="flex items-center justify-end gap-2 min-w-[100px] sm:min-w-[180px]">
              <span className="text-pink-500 text-[8px] font-bold uppercase tracking-widest opacity-80 hidden sm:inline whitespace-nowrap">Осталось:</span>
              <div className="w-14 sm:w-16 text-right">
                <p className="text-base md:text-lg font-orbitron font-black text-white tabular-nums leading-none">
                  <span ref={distanceTextRef}>{LEVEL1_CONFIG.WIN_DISTANCE}</span>
                  <span className="text-[8px] ml-0.5 text-pink-500/80 tracking-normal">М</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {countdown !== null && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
           <div key={countdown} className="animate-countdown text-8xl md:text-9xl font-orbitron font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]">
              {countdown}
           </div>
        </div>
      )}

      <canvas 
        ref={canvasRef} 
        width={window.innerWidth} 
        height={window.innerHeight}
        className="bg-slate-950 block"
        style={{ transform: 'translateZ(0)' }} // Force GPU acceleration for Safari
      />
    </div>
  );
};

export default Level1;
