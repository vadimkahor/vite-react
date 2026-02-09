
import React, { useEffect, useState } from 'react';

interface IntroSequenceProps {
  level: number;
  onComplete: () => void;
}

const IntroSequence: React.FC<IntroSequenceProps> = ({ level, onComplete }) => {
  const [step, setStep] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Timeline of the intro depends on the level
    let schedule: { time: number; action: () => void }[] = [];

    if (level === 1) {
      schedule = [
        { time: 500, action: () => setStep(1) }, // Message 1 (Vera)
        { time: 4500, action: () => setStep(2) }, // Message 2 (Katya)
        { time: 9000, action: () => setFadingOut(true) }, 
        { time: 10000, action: onComplete } 
      ];
    } else if (level === 2) {
      schedule = [
        { time: 500, action: () => setStep(1) }, // Katya: Я уже еду...
        { time: 3500, action: () => setStep(2) }, // Vera: Столик в дальнем...
        { time: 6500, action: () => setStep(3) }, // Katya: Буду через минуту.
        { time: 9000, action: () => setFadingOut(true) },
        { time: 10000, action: onComplete }
      ];
    } else if (level === 3) {
      schedule = [
        { time: 500, action: () => setStep(1) }, // Katya: Я на месте
        { time: 2500, action: () => setStep(2) }, // Vera: Поторопись...
        { time: 5500, action: () => setStep(3) }, // Vera: В прямом смысле!
        { time: 8000, action: () => setStep(4) }, // Katya: O_O ?!
        { time: 10500, action: () => setFadingOut(true) },
        { time: 11500, action: onComplete }
      ];
    }

    const timers = schedule.map(item => setTimeout(item.action, item.time));

    return () => timers.forEach(clearTimeout);
  }, [onComplete, level]);

  const renderLevel1 = () => (
    <div className="w-full max-w-2xl flex flex-col gap-8">
      {/* Message 1: Vera (Left) */}
      <div className={`flex items-end gap-4 transition-all duration-700 transform ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white shrink-0 border-2 border-slate-600">
          ВТ
        </div>
        <div className="flex flex-col gap-2 max-w-[90%]">
          <span className="text-slate-400 text-sm ml-2 font-orbitron">Вера Тимлид</span>
          <div className="bg-[#2d2d2d] text-slate-100 px-6 py-5 rounded-3xl rounded-bl-none shadow-lg border border-slate-800">
            <p className="text-lg leading-relaxed">
              Катя, нам нужно срочно поговорить. Жду тебя в твоем любимом японском ресторане.
            </p>
          </div>
        </div>
      </div>

      {/* Message 2: Katya (Right) */}
      <div className={`flex items-end gap-4 justify-end transition-all duration-700 transform ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="flex flex-col gap-2 items-end max-w-[90%]">
          <div className="bg-pink-600 text-white px-6 py-5 rounded-3xl rounded-br-none shadow-[0_0_15px_rgba(236,72,153,0.3)] border border-pink-500">
            <p className="text-lg leading-relaxed">
              Хорошо, вызываю такси и еду к тебе.
            </p>
          </div>
          <span className="text-pink-500/50 text-xs mr-2">Доставлено</span>
        </div>
        <div className="w-14 h-14 rounded-full bg-pink-900/50 flex items-center justify-center text-sm font-bold text-pink-200 shrink-0 border-2 border-pink-500/30">
          Я
        </div>
      </div>
    </div>
  );

  const renderLevel2 = () => (
    <div className="w-full max-w-2xl flex flex-col gap-8">
      {/* Message 1: Katya (Right) */}
      <div className={`flex items-end gap-4 justify-end transition-all duration-700 transform ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="flex flex-col gap-2 items-end max-w-[90%]">
          <div className="bg-pink-600 text-white px-6 py-5 rounded-3xl rounded-br-none shadow-[0_0_15px_rgba(236,72,153,0.3)] border border-pink-500">
            <p className="text-lg leading-relaxed">
              Я уже еду. Где мне тебя найти?
            </p>
          </div>
          <span className="text-pink-500/50 text-xs mr-2">Доставлено</span>
        </div>
        <div className="w-14 h-14 rounded-full bg-pink-900/50 flex items-center justify-center text-sm font-bold text-pink-200 shrink-0 border-2 border-pink-500/30">
          Я
        </div>
      </div>

      {/* Message 2: Vera (Left) */}
      <div className={`flex items-end gap-4 transition-all duration-700 transform ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white shrink-0 border-2 border-slate-600">
          ВТ
        </div>
        <div className="flex flex-col gap-2 max-w-[90%]">
          <span className="text-slate-400 text-sm ml-2 font-orbitron">Вера Тимлид</span>
          <div className="bg-[#2d2d2d] text-slate-100 px-6 py-5 rounded-3xl rounded-bl-none shadow-lg border border-slate-800">
            <p className="text-lg leading-relaxed">
              Столик в дальнем конце зала.
            </p>
          </div>
        </div>
      </div>

      {/* Message 3: Katya (Right) */}
      <div className={`flex items-end gap-4 justify-end transition-all duration-700 transform ${step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="flex flex-col gap-2 items-end max-w-[90%]">
          <div className="bg-pink-600 text-white px-6 py-5 rounded-3xl rounded-br-none shadow-[0_0_15px_rgba(236,72,153,0.3)] border border-pink-500">
            <p className="text-lg leading-relaxed">
              Буду через минуту.
            </p>
          </div>
          <span className="text-pink-500/50 text-xs mr-2">Доставлено</span>
        </div>
        <div className="w-14 h-14 rounded-full bg-pink-900/50 flex items-center justify-center text-sm font-bold text-pink-200 shrink-0 border-2 border-pink-500/30">
          Я
        </div>
      </div>
    </div>
  );

  const renderLevel3 = () => (
    <div className="w-full max-w-2xl flex flex-col gap-6">
      {/* Message 1: Katya (Right) */}
      <div className={`flex items-end gap-4 justify-end transition-all duration-700 transform ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="flex flex-col gap-2 items-end max-w-[90%]">
          <div className="bg-pink-600 text-white px-6 py-4 rounded-3xl rounded-br-none shadow-[0_0_15px_rgba(236,72,153,0.3)] border border-pink-500">
            <p className="text-lg leading-relaxed">
              Я на месте.
            </p>
          </div>
          <span className="text-pink-500/50 text-xs mr-2">Доставлено</span>
        </div>
        <div className="w-14 h-14 rounded-full bg-pink-900/50 flex items-center justify-center text-sm font-bold text-pink-200 shrink-0 border-2 border-pink-500/30">
          Я
        </div>
      </div>

      {/* Message 2: Vera (Left) */}
      <div className={`flex items-end gap-4 transition-all duration-700 transform ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white shrink-0 border-2 border-slate-600">
          ВТ
        </div>
        <div className="flex flex-col gap-2 max-w-[90%]">
          <span className="text-slate-400 text-sm ml-2 font-orbitron">Вера Тимлид</span>
          <div className="bg-[#2d2d2d] text-slate-100 px-6 py-4 rounded-3xl rounded-bl-none shadow-lg border border-slate-800">
            <p className="text-lg leading-relaxed">
              Поторопись, пожалуйста... На меня давят.
            </p>
          </div>
        </div>
      </div>

      {/* Message 3: Vera (Left) - Added Emphasis */}
      <div className={`flex items-end gap-4 transition-all duration-700 transform ${step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="w-14 h-14 opacity-0" /> {/* Spacer */}
        <div className="flex flex-col gap-2 max-w-[90%]">
          <div className="bg-[#2d2d2d] text-slate-100 px-6 py-4 rounded-3xl rounded-tl-none shadow-lg border border-slate-800">
            <p className="text-lg leading-relaxed font-bold text-red-400">
              В прямом смысле!
            </p>
          </div>
        </div>
      </div>

      {/* Message 4: Katya (Right) */}
      <div className={`flex items-end gap-4 justify-end transition-all duration-700 transform ${step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="flex flex-col gap-2 items-end max-w-[90%]">
          <div className="bg-pink-600 text-white px-6 py-4 rounded-3xl rounded-br-none shadow-[0_0_15px_rgba(236,72,153,0.3)] border border-pink-500">
            <p className="text-xl leading-relaxed font-bold tracking-widest">
              О_О ?!
            </p>
          </div>
          <span className="text-pink-500/50 text-xs mr-2">Прочитано</span>
        </div>
        <div className="w-14 h-14 rounded-full bg-pink-900/50 flex items-center justify-center text-sm font-bold text-pink-200 shrink-0 border-2 border-pink-500/30">
          Я
        </div>
      </div>
    </div>
  );

  return (
    <div className={`fixed inset-0 z-50 bg-[#020615] flex flex-col items-center justify-center p-6 font-inter transition-opacity duration-1000 ${fadingOut ? 'opacity-0' : 'opacity-100'}`}>
      {level === 1 ? renderLevel1() : level === 2 ? renderLevel2() : renderLevel3()}
    </div>
  );
};

export default IntroSequence;
