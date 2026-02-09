
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { LEVEL3_CONFIG } from './config';
import { Level3State, Door } from './types';
import { updateLevel3 } from './physics';
import { drawLevel3, clearStaticCache } from './render';
import { generateLevelMap } from './generator/map';
import { spawnEnemiesForRoom } from './logic/EnemyLogic';
import { drawAshPile } from './render/Enemy';

interface Level3Props {
  isActive: boolean;
  onGameOver: () => void;
  onComplete: (score: number, time: number) => void;
}

const Level3: React.FC<Level3Props> = ({ isActive, onGameOver, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  
  const timeElapsed = useRef<number>(0);

  // Состояния для реактивного UI
  const [bombUI, setBombUI] = useState({ charges: 2, timers: [] as number[], room: 1 });
  
  // Состояние перехода
  const [transition, setTransition] = useState<{ active: boolean, opacity: number }>({ active: false, opacity: 0 });

  // Обратный отсчет
  const [countdown, setCountdown] = useState<number | string | null>(null);
  const inputEnabled = useRef(false);

  const stateRef = useRef<Level3State>({
    player: {
      x: LEVEL3_CONFIG.TILE_SIZE + 10,
      y: LEVEL3_CONFIG.TILE_SIZE + 10,
      dir: 'down',
      isMoving: false,
      frame: 0,
      speechBubble: undefined
    },
    enemies: [],
    softBlocks: [],
    doors: [],
    bombs: [],
    explosions: [],
    ashPiles: [],
    timer: 0,
    bombCharges: 2,
    maxBombCharges: 2,
    rechargeTimers: [],
    roomNumber: 1,
    cakePos: undefined
  });

  const initRoom = useCallback((roomNum: number, prevExitDoor?: Door) => {
      let forcedEntry: Door | undefined = undefined;
      if (prevExitDoor) {
          const mirroredCol = (LEVEL3_CONFIG.COLS - 1) - prevExitDoor.col;
          const mirroredRow = (LEVEL3_CONFIG.ROWS - 1) - prevExitDoor.row;
          let mirroredSide: Door['side'] = 'left';
          if (mirroredCol === 0) mirroredSide = 'left';
          else if (mirroredCol === LEVEL3_CONFIG.COLS - 1) mirroredSide = 'right';
          else if (mirroredRow === 0) mirroredSide = 'top';
          else if (mirroredRow === LEVEL3_CONFIG.ROWS - 1) mirroredSide = 'bottom';

          forcedEntry = { col: mirroredCol, row: mirroredRow, side: mirroredSide, type: 'entry' };
      }

      const { softBlocks, doors, cakePos } = generateLevelMap(forcedEntry, roomNum === 2);
      const ts = LEVEL3_CONFIG.TILE_SIZE;
      const pw = LEVEL3_CONFIG.PLAYER_WIDTH;
      const ph = LEVEL3_CONFIG.PLAYER_HEIGHT;

      stateRef.current.softBlocks = softBlocks;
      stateRef.current.doors = doors;
      stateRef.current.roomNumber = roomNum;
      stateRef.current.cakePos = cakePos;
      
      stateRef.current.bombs = [];
      stateRef.current.explosions = [];
      stateRef.current.ashPiles = [];
      
      const entryDoor = doors.find(d => d.type === 'entry');
      if (entryDoor) {
          if (entryDoor.side === 'left') {
              stateRef.current.player.x = ts + (ts - pw) / 2;
              stateRef.current.player.y = entryDoor.row * ts + (ts - ph) / 2;
              stateRef.current.player.dir = 'right';
          } else if (entryDoor.side === 'right') {
              stateRef.current.player.x = (LEVEL3_CONFIG.COLS - 2) * ts + (ts - pw) / 2;
              stateRef.current.player.y = entryDoor.row * ts + (ts - ph) / 2;
              stateRef.current.player.dir = 'left';
          } else if (entryDoor.side === 'top') {
              stateRef.current.player.x = entryDoor.col * ts + (ts - pw) / 2;
              stateRef.current.player.y = ts + (ts - ph) / 2;
              stateRef.current.player.dir = 'down';
          } else {
              stateRef.current.player.x = entryDoor.col * ts + (ts - pw) / 2;
              stateRef.current.player.y = (LEVEL3_CONFIG.ROWS - 2) * ts + (ts - ph) / 2;
              stateRef.current.player.dir = 'up';
          }
      }
      
      // Спавн врагов ПОСЛЕ дверей и игрока
      spawnEnemiesForRoom(stateRef.current);
      
      clearStaticCache();
      setBombUI(prev => ({ ...prev, room: roomNum }));
  }, []);

  // Инициализация при старте уровня
  useEffect(() => {
      initRoom(1);
      
      let interval: ReturnType<typeof setInterval>;
      let timeout: ReturnType<typeof setTimeout>;

      if (isActive) {
          inputEnabled.current = false;
          
          // Задержка перед стартом таймера, чтобы шторка успела открыться
          const SHUTTER_DELAY = 1200; 
          
          timeout = setTimeout(() => {
              let count = 3;
              setCountdown(count);
              
              // ФРАЗА НА СТАРТЕ
              stateRef.current.player.speechBubble = {
                  text: LEVEL3_CONFIG.KATYA_PHRASES.START[0],
                  timer: 180, // 3 секунды
                  maxTimer: 180
              };
              
              interval = setInterval(() => {
                  count--;
                  if (count > 0) {
                      setCountdown(count);
                  } else if (count === 0) {
                      setCountdown('GO!');
                      inputEnabled.current = true;
                  } else {
                      setCountdown(null);
                      clearInterval(interval);
                  }
              }, 600);
          }, SHUTTER_DELAY);
      }
      
      return () => {
          if (interval) clearInterval(interval);
          if (timeout) clearTimeout(timeout);
      };
  }, [isActive, initRoom]);

  const handleExitReached = useCallback(() => {
      if (stateRef.current.roomNumber === 1 && !transition.active) {
          setTransition({ active: true, opacity: 0 });
          
          let opacity = 0;
          const fadeOut = setInterval(() => {
              opacity += 0.05;
              if (opacity >= 1) {
                  clearInterval(fadeOut);
                  setTransition({ active: true, opacity: 1 });
                  
                  const ts = LEVEL3_CONFIG.TILE_SIZE;
                  const p = stateRef.current.player;
                  const px = p.x + LEVEL3_CONFIG.PLAYER_WIDTH / 2;
                  const py = p.y + LEVEL3_CONFIG.PLAYER_HEIGHT / 2;
                  const col = Math.floor(px / ts);
                  const row = Math.floor(py / ts);
                  const touchedExit = stateRef.current.doors.find(d => d.type === 'exit' && d.col === col && d.row === row);
                  initRoom(2, touchedExit);
                  
                  setTimeout(() => {
                      const fadeIn = setInterval(() => {
                          opacity -= 0.05;
                          if (opacity <= 0) {
                              clearInterval(fadeIn);
                              setTransition({ active: false, opacity: 0 });
                          } else {
                              setTransition({ active: true, opacity });
                          }
                      }, 20);
                  }, 100);
              } else {
                  setTransition({ active: true, opacity });
              }
          }, 20);
      } else if (stateRef.current.roomNumber === 2 && !transition.active) {
          // Финальное затемнение при взятии торта
          setTransition({ active: true, opacity: 0 });
          
          let opacity = 0;
          const fadeOut = setInterval(() => {
              opacity += 0.02; // Медленное, драматичное затемнение
              if (opacity >= 1) {
                  clearInterval(fadeOut);
                  setTransition({ active: true, opacity: 1 });
                  
                  // ПЛАВНЫЙ ПЕРЕХОД: Сразу вызываем onComplete без задержки, чтобы BirthdayScreen плавно появился
                  onComplete(1000, timeElapsed.current);
              } else {
                  setTransition({ active: true, opacity });
              }
          }, 16);
      }
  }, [initRoom, onComplete, transition.active]);

  const loop = useCallback((time: number) => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = time - lastTimeRef.current;
    lastTimeRef.current = time;
    const timeScale = dt / (1000 / 60);

    timeElapsed.current += dt / 1000;

    // Обновляем физику ТОЛЬКО если ввод разрешен (таймер кончился) и нет активного перехода
    if (inputEnabled.current && (!transition.active || transition.opacity < 0.8)) {
        updateLevel3(stateRef.current, keysRef.current, timeScale, onGameOver, () => {
            handleExitReached();
        });
    }
    
    // Обновление таймера пузыря игрока
    if (stateRef.current.player.speechBubble) {
        stateRef.current.player.speechBubble.timer -= timeScale;
        if (stateRef.current.player.speechBubble.timer <= 0) {
            stateRef.current.player.speechBubble = undefined;
        }
    }
    
    drawLevel3(ctx, stateRef.current, canvas.width, canvas.height);

    // Рисуем пепел (поверх пола, под персонажами)
    const ts = LEVEL3_CONFIG.TILE_SIZE;
    const offsetX = Math.floor((canvas.width - LEVEL3_CONFIG.COLS * ts) / 2);
    const offsetY = Math.floor((canvas.height - LEVEL3_CONFIG.ROWS * ts) / 2);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    stateRef.current.ashPiles.forEach(ash => drawAshPile(ctx, ash, ts));
    ctx.restore();

    if (Math.floor(time / 100) % 2 === 0) {
        setBombUI({
            charges: stateRef.current.bombCharges,
            timers: [...stateRef.current.rechargeTimers],
            room: stateRef.current.roomNumber
        });
    }

    requestRef.current = requestAnimationFrame(loop);
  }, [isActive, handleExitReached, transition.active, transition.opacity, onGameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keysRef.current.add(e.key);
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    if (isActive) requestRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isActive, loop]);

  return (
    <div className="relative w-full h-full bg-slate-900 flex flex-col items-center justify-center">
      <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} className="block" />
      
      {transition.active && (
          <div 
            className="absolute inset-0 bg-black pointer-events-none z-[100]" 
            style={{ opacity: transition.opacity }}
          />
      )}

      {/* Отрисовка обратного отсчета */}
      {countdown !== null && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center pointer-events-none">
           <div key={countdown} className="animate-countdown text-8xl md:text-9xl font-orbitron font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]">
              {countdown}
           </div>
        </div>
      )}

      <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-2xl z-50">
          <div className="flex flex-col items-start mr-4">
              <div className="text-[9px] font-orbitron text-pink-500 font-bold tracking-widest uppercase opacity-80 leading-none">ПРОБЕЛ</div>
              <div className="text-sm font-orbitron font-black text-white leading-none mt-0.5 tracking-tighter uppercase">ПОСТАВИТЬ БОМБУ</div>
          </div>
          <div className="h-8 w-px bg-white/10 mx-2" />
          <div className="flex gap-3 px-1">
              {[...Array(stateRef.current.maxBombCharges)].map((_, i) => {
                  const isReady = i < bombUI.charges;
                  const rechargeTime = !isReady ? bombUI.timers[stateRef.current.maxBombCharges - 1 - i] : 0;
                  const progress = rechargeTime ? (1 - rechargeTime / 180) * 100 : 0;
                  return (
                      <div key={i} className="relative w-7 h-9 flex items-center justify-center">
                          <div className={`w-5 h-7 rounded-md border transition-all duration-300 ${isReady ? 'bg-red-600 border-red-400 shadow-[0_0_10px_rgba(220,38,38,0.4)] scale-110' : 'bg-slate-800 border-slate-700 opacity-30 scale-90'}`}>
                              <div className="w-full h-[1px] bg-amber-400 mt-1.5 opacity-40" />
                              <div className="w-full h-[1px] bg-amber-400 mt-1.5 opacity-40" />
                          </div>
                          {!isReady && <div className="absolute -bottom-1.5 inset-x-0 h-1 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-amber-500" style={{ width: `${progress}%` }} /></div>}
                      </div>
                  );
              })}
          </div>
          <div className="ml-4 flex items-center">
              <span className="text-xs font-orbitron font-bold text-white/50 mr-1.5">×</span>
              <span className="text-lg font-orbitron font-black text-white">{bombUI.charges}</span>
          </div>
          <div className="h-8 w-px bg-white/10 mx-4" />
          <div className="flex flex-col items-center">
              <div className="text-[9px] font-orbitron text-green-500 font-bold tracking-widest uppercase opacity-80 leading-none">Зал</div>
              <div className="text-lg font-orbitron font-black text-white leading-none mt-0.5">{bombUI.room}/2</div>
          </div>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/5 font-orbitron text-[10px] tracking-widest uppercase pointer-events-none">Суши Ярости • Уровень 3</div>
    </div>
  );
};

export default Level3;
