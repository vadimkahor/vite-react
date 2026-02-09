
import React, { useState, useEffect, useCallback } from 'react';
import { GameStatus } from './types';
import Level1 from './levels/level1/Level1';
import Level2 from './levels/level2/Level2';
import IntroSequence from './components/IntroSequence';

// Список имен водителей для уровня ГОНКИ ПО МКАД
const DRIVER_NAMES = [
  'Махмуджон', 'Мухаммад', 'Абдуллох', 'Абдурахмон', 'Юсуф', 
  'Умар', 'Ибрагим', 'Сухроб', 'Джамшед', 'Бахтовар', 
  'Алиджон', 'Исмаил', 'Фарход', 'Сафар', 'Шохрух'
];

// Компонент перехода (Шторки)
const TransitionEffect: React.FC<{ 
  label: string, 
  onComplete: () => void 
}> = ({ label, onComplete }) => {
  useEffect(() => {
    // Время анимации: 0.8s пауза + 0.6s открытие = 1.4s
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="absolute inset-0 z-[100] pointer-events-none flex flex-col">
      {/* Верхняя шторка */}
      <div className="h-1/2 w-full bg-black border-b-2 border-pink-500 relative animate-shutter-up origin-top flex items-end justify-center overflow-hidden">
         <div className="absolute bottom-4 text-white font-orbitron font-bold text-4xl tracking-[0.5em] animate-text-zoom whitespace-nowrap">
            {label}
         </div>
      </div>
      
      {/* Нижняя шторка */}
      <div className="h-1/2 w-full bg-black border-t-2 border-pink-500 relative animate-shutter-down origin-bottom flex items-start justify-center overflow-hidden">
          {/* Дублируем текст для эффекта разрезания */}
         <div className="absolute top-4 text-white font-orbitron font-bold text-4xl tracking-[0.5em] animate-text-zoom whitespace-nowrap opacity-50 blur-[1px] transform scale-y-[-1]">
            {label}
         </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [highScore, setHighScore] = useState(0);
  const [gameStats, setGameStats] = useState({ score: 0, distance: 0 });
  const [levelResult, setLevelResult] = useState({ score: 0, time: 0, level: 1 });
  const [randomDriverName, setRandomDriverName] = useState('');
  
  // Ключ для принудительного пересоздания компонента уровня (сброс всех useRef)
  const [restartKey, setRestartKey] = useState(0);
  
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  
  // Состояние для управления переходом
  const [transitioning, setTransitioning] = useState(false);
  const [transitionLabel, setTransitionLabel] = useState('');
  
  // Состояние для анимации выхода из меню
  const [menuExiting, setMenuExiting] = useState(false);
  
  // Режим битвы с боссом
  const [isBossRush, setIsBossRush] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('gnd_high_score');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Handler for Game Over (Crash)
  const handleGameOver = useCallback((finalScore: number) => {
    setGameStats({ score: finalScore, distance: 0 }); 
    
    // Если проигрыш на втором уровне (МКАД), выбираем имя водителя
    if (currentLevel === 2) {
      const name = DRIVER_NAMES[Math.floor(Math.random() * DRIVER_NAMES.length)];
      setRandomDriverName(name);
    }
    
    setStatus(GameStatus.GAMEOVER);
    
    // Save High Score
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('gnd_high_score', finalScore.toString());
    }
  }, [highScore, currentLevel]);

  // Handler for Level Completion (Data collection)
  const handleLevelComplete = useCallback((finalScore: number, timeSpent: number) => {
    // Сохраняем результаты уровня
    setLevelResult({
      score: finalScore,
      time: timeSpent,
      level: currentLevel
    });
    
    // Показываем экран завершения уровня
    setStatus(GameStatus.LEVEL_COMPLETE);
    
    // Save High Score just in case
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('gnd_high_score', finalScore.toString());
    }
  }, [currentLevel, highScore]);

  // Handler for "Continue" button on Level Complete screen
  const handleNextLevel = () => {
    if (currentLevel === 1) {
      // Transition to Level 2
      setCurrentLevel(2);
      setIsBossRush(false); // Reset boss rush for next level
      setStatus(GameStatus.INTRO); // Show intro for level 2
    } else {
      // Game Complete -> Menu
      setStatus(GameStatus.MENU);
      setCurrentLevel(1);
      setIsBossRush(false);
    }
  };

  const handleRestartLevel = () => {
    startLevel(currentLevel, isBossRush);
  };

  const triggerTransition = (label: string) => {
    setTransitionLabel(label);
    setTransitioning(true);
  };

  const startLevel = (levelIndex?: number, bossRush = false) => {
    setShowLevelSelect(false);
    
    setIsBossRush(bossRush);
    
    const targetLevel = levelIndex ?? currentLevel;
    
    // Инкрементируем ключ, чтобы сбросить внутренние useRef в компоненте уровня
    setRestartKey(prev => prev + 1);
    
    // Запускаем переход перед началом игры
    const label = bossRush ? 'BOSS BATTLE' : `LEVEL ${targetLevel}`;
    triggerTransition(label);
    setStatus(GameStatus.PLAYING);
  };

  // Handler for the main start button - triggers fade out then INTRO
  const handleMainStart = () => {
    setMenuExiting(true);
    
    // Wait for fade out animation (1s) + buffer
    setTimeout(() => {
      setCurrentLevel(1);
      setStatus(GameStatus.INTRO);
      setMenuExiting(false);
    }, 1200);
  };

  const renderLevel = () => {
    const isGameOver = status === GameStatus.GAMEOVER;
    const isActive = status === GameStatus.PLAYING || isGameOver;
    // Уникальный ключ гарантирует полный сброс компонента
    const levelKey = `${currentLevel}-${restartKey}`;

    switch (currentLevel) {
      case 1:
        return (
          <Level2
            key={levelKey}
            isActive={isActive}
            isGameOver={isGameOver}
            onGameOver={handleGameOver}
            onComplete={handleLevelComplete}
            startAtBoss={isBossRush}
          />
        );
      case 2:
        return (
          <Level1 
            key={levelKey}
            isActive={isActive}
            isGameOver={isGameOver}
            onGameOver={handleGameOver} 
            onComplete={handleLevelComplete} 
          />
        );
      case 3:
        return <div className="text-white text-center mt-20 font-orbitron">LEVEL 3 COMING SOON</div>;
      default:
        return null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 select-none">
      
      {/* TRANSITION OVERLAY */}
      {transitioning && (
        <TransitionEffect 
          label={transitionLabel} 
          onComplete={() => setTransitioning(false)} 
        />
      )}

      {/* INTRO SEQUENCE */}
      {status === GameStatus.INTRO && (
        <IntroSequence level={currentLevel} onComplete={() => startLevel(currentLevel)} />
      )}

      {/* LEVEL RENDERER - Keep visible during Game Over and Completion for darkening effect */}
      {(status === GameStatus.PLAYING || status === GameStatus.LEVEL_COMPLETE || status === GameStatus.GAMEOVER) && renderLevel()}

      {/* MENU SCREEN */}
      {status === GameStatus.MENU && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 p-6">
            {!showLevelSelect ? (
              <div 
                className={`text-center flex flex-col items-center transition-all duration-1000 ease-in-out ${
                  menuExiting 
                    ? 'opacity-0 scale-90 blur-sm translate-y-10' 
                    : 'opacity-100 scale-100 translate-y-0 animate-in fade-in zoom-in duration-1000'
                }`}
              >
                <h1 className="text-7xl md:text-8xl font-orbitron font-black text-white mb-20 neon-text tracking-tighter text-center leading-none uppercase">
                  GIRL<br/><span className="text-pink-500">NEXT DOOR</span>
                </h1>
                
                <button 
                  onClick={handleMainStart}
                  disabled={menuExiting}
                  className="group relative px-12 py-5 bg-transparent border-2 border-pink-500 text-pink-500 font-orbitron font-bold text-xl rounded-full transition-all hover:bg-pink-500 hover:text-white hover:scale-110 active:scale-95 shadow-[0_0_30px_rgba(255,0,127,0.4)] animate-pulse disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  INSERT COIN TO START
                </button>

                <button 
                  onClick={() => setShowLevelSelect(true)}
                  disabled={menuExiting}
                  className="mt-12 text-pink-500/30 hover:text-pink-500 font-orbitron text-[10px] md:text-xs tracking-[0.4em] transition-colors duration-300 uppercase select-none hover:scale-105"
                >
                  [ ЧИТЫ ]
                </button>
              </div>
            ) : (
              <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center bg-slate-900/50 p-10 rounded-3xl border border-pink-500/20 backdrop-blur-md shadow-[0_0_50px_rgba(236,72,153,0.1)]">
                  <h2 className="text-2xl md:text-3xl font-orbitron font-bold text-white mb-8 tracking-widest text-shadow-pink">LEVEL SELECT</h2>
                  
                  <div className="flex flex-col gap-4 w-full min-w-[240px]">
                      <button 
                          onClick={() => { setCurrentLevel(1); startLevel(1); }}
                          className="px-6 py-4 bg-slate-800 hover:bg-pink-600 border border-slate-700 hover:border-pink-400 text-white font-orbitron font-bold text-sm rounded transition-all hover:scale-105 uppercase tracking-wider text-left flex justify-between group"
                      >
                         <span>Level 1</span>
                         <span className="text-slate-500 group-hover:text-white/70 text-[10px]">ПОБЕГ ИЗ ОФИСА</span>
                      </button>

                      <button 
                          onClick={() => { setCurrentLevel(2); startLevel(2); }}
                          className="px-6 py-4 bg-slate-800 hover:bg-pink-600 border border-slate-700 hover:border-pink-400 text-white font-orbitron font-bold text-sm rounded transition-all hover:scale-105 uppercase tracking-wider text-left flex justify-between group"
                      >
                         <span>Level 2</span>
                         <span className="text-slate-500 group-hover:text-white/70 text-[10px]">ГОНКИ ПО МКАД</span>
                      </button>
                      
                      <button 
                          onClick={() => { setCurrentLevel(1); startLevel(1, true); }}
                          className="px-6 py-3 bg-red-900/50 hover:bg-red-600 border border-red-500/50 hover:border-red-400 text-red-100 font-orbitron font-bold text-xs rounded transition-all hover:scale-105 uppercase tracking-wider text-center flex justify-between items-center group"
                      >
                         <span>БИТВА С БОССОМ</span>
                         <span className="text-[10px] bg-red-500/20 px-1 rounded border border-red-500/30">FAST</span>
                      </button>
                  </div>

                  <button 
                      onClick={() => setShowLevelSelect(false)}
                      className="mt-8 text-slate-500 hover:text-white font-orbitron text-xs tracking-[0.2em] transition-colors uppercase"
                  >
                      &lt; BACK
                  </button>
              </div>
            )}
        </div>
      )}

      {/* LEVEL COMPLETE SCREEN */}
      {status === GameStatus.LEVEL_COMPLETE && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 text-center overflow-hidden">
          {/* SMOOTH FADE IN OVERLAY (Matches Game Over) */}
          <div className="absolute inset-0 bg-black animate-fade-in" />

          <div className="relative max-w-4xl w-full flex flex-col items-center opacity-0 animate-[fade-in_1s_ease-out_1.2s_forwards] slide-in-from-bottom-12 duration-700">
            <h2 className="text-[7vw] sm:text-5xl md:text-7xl font-orbitron font-black text-green-500 mb-2 drop-shadow-[0_0_20px_rgba(34,197,94,0.5)] uppercase tracking-tighter text-center w-full whitespace-nowrap leading-none">
              LEVEL {levelResult.level} COMPLETE
            </h2>
            <p className="text-xl md:text-2xl text-white font-medium opacity-80 text-center tracking-widest mb-10 uppercase">
              {levelResult.level === 1 ? 'Катя успешно сбежала из офиса' : 'Катя успешно доехала до ресторана'}
            </p>
            
            <div className="flex justify-center mb-12 w-full max-w-lg">
                <div className="bg-slate-900/50 border border-white/10 p-6 rounded-2xl flex flex-col items-center w-full">
                    <span className="text-slate-400 font-orbitron text-sm tracking-widest mb-2">ВРЕМЯ</span>
                    <span className="text-3xl font-orbitron font-bold text-white">{formatTime(levelResult.time)}</span>
                </div>
            </div>

            <div className="w-full max-w-md space-y-4">
              <button 
                onClick={handleNextLevel}
                className="w-full py-5 bg-green-600 text-white font-orbitron font-bold text-xl rounded-xl transition-all hover:bg-green-500 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(34,197,94,0.3)] uppercase animate-pulse"
              >
                ПРОДОЛЖИТЬ
              </button>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={handleRestartLevel}
                    className="py-4 bg-slate-800 border border-slate-700 text-white font-orbitron font-bold text-sm rounded-xl transition-all hover:bg-slate-700 hover:scale-105 uppercase"
                >
                    ЗАНОВО
                </button>
                <button 
                    onClick={() => setStatus(GameStatus.MENU)}
                    className="py-4 bg-slate-800 border border-slate-700 text-white font-orbitron font-bold text-sm rounded-xl transition-all hover:bg-slate-700 hover:scale-105 uppercase"
                >
                    МЕНЮ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GAMEOVER SCREEN */}
      {status === GameStatus.GAMEOVER && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 text-center overflow-hidden">
          {/* DARKENING OVERLAY */}
          <div className="absolute inset-0 bg-black animate-fade-in" />
          
          <div className="relative max-w-4xl w-full flex flex-col items-center opacity-0 animate-[fade-in_1s_ease-out_1.2s_forwards] slide-in-from-bottom-12 duration-700">
            <h2 className="text-[7vw] sm:text-5xl md:text-7xl font-orbitron font-black text-pink-500 mb-6 drop-shadow-[0_0_20px_rgba(236,72,153,0.5)] uppercase tracking-tighter text-center w-full whitespace-nowrap leading-none">
              {currentLevel === 1 ? 'КАТЯ НЕ СМОГЛА' : 'КАТЯ ОПОЗДАЛА'}
            </h2>
            
            <div className="mb-8 px-4 max-w-2xl">
              <p className="text-xl md:text-2xl text-white font-medium opacity-90 text-center tracking-tight mb-4">
                {currentLevel === 1 
                  ? 'Еще никто не покидал офис ВТБ раньше 18:00'
                  : `Лучше бы ${randomDriverName} готовил шаурму, а не водил такси...`}
              </p>
            </div>

            <div className="w-full max-w-md space-y-4">
              <button 
                onClick={() => { 
                  // Restart Current Level
                  startLevel(currentLevel, isBossRush);
                }}
                className="w-full py-5 bg-pink-600 text-white font-orbitron font-bold text-xl rounded-xl transition-all hover:bg-pink-500 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(236,72,153,0.3)] uppercase"
              >
                ПОПРОБОВАТЬ СНОВА
              </button>
              <button 
                onClick={() => setStatus(GameStatus.MENU)}
                className="w-full py-4 bg-transparent text-slate-500 font-orbitron font-bold text-sm rounded-xl transition-all hover:text-pink-500/80 uppercase tracking-[0.2em]"
              >
                В ГЛАВНОЕ МЕНЮ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
