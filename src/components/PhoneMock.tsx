import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Step {
  big: string;
  label?: string;
  tone: 'white' | 'blue' | 'green' | 'accent';
}

const sequence: Step[] = [
  { big: '1', label: 'JAB', tone: 'white' },
  { big: '2', label: 'CROSS', tone: 'white' },
  { big: '3', label: 'LEFT HOOK', tone: 'white' },
  { big: 'SLIP', tone: 'blue' },
  { big: '2', label: 'CROSS', tone: 'white' },
  { big: 'PIVOT', tone: 'green' },
  { big: '1', label: 'JAB', tone: 'white' },
  { big: '4', label: 'RIGHT HOOK', tone: 'white' },
];

const toneMap: Record<Step['tone'], string> = {
  white: 'text-white',
  blue: 'text-[#5AC8FA]',
  green: 'text-[#34D399]',
  accent: 'text-accent',
};

export function PhoneMock({ className = '' }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(147);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setIndex((prev) => (prev + 1) % sequence.length);
    }, 1500);
    const clock = setInterval(() => {
      setSeconds((s) => (s <= 1 ? 180 : s - 1));
    }, 1000);
    return () => {
      clearInterval(stepTimer);
      clearInterval(clock);
    };
  }, []);

  const step = sequence[index];
  const mins = Math.floor(seconds / 60);
  const secs = String(seconds % 60).padStart(2, '0');
  const progress = 1 - seconds / 180;

  return (
    <div className={`relative ${className}`}>
      <motion.div
        className="relative w-[280px] h-[572px] rounded-[46px] bg-[#0a0a0c] border-[6px] border-[#1c1c20] shadow-[0_50px_120px_-20px_rgba(0,0,0,0.8)]"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[26px] bg-[#0a0a0c] rounded-b-2xl z-20" />

        <div className="absolute inset-[6px] rounded-[40px] overflow-hidden bg-gradient-to-br from-[#150b0d] via-[#0b0b10] to-[#050608]">
          {/* Top status */}
          <div className="pt-10 px-6 flex items-start justify-between">
            <div>
              <div className="font-display text-[13px] tracking-[0.15em] text-white/90">ROUND 2/3</div>
              <div className="text-[10px] font-semibold tracking-[0.1em] text-white/40 mt-1">TECHNICAL</div>
            </div>
            <motion.div
              key={seconds <= 10 ? 'urgent' : 'calm'}
              className={`font-display text-3xl ${seconds <= 10 ? 'text-accent' : 'text-white'}`}
            >
              {mins}:{secs}
            </motion.div>
          </div>

          {/* Progress bar */}
          <div className="mx-6 mt-3 h-[6px] rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full bg-accent rounded-full"
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </div>

          {/* Big callout */}
          <div className="flex-1 flex flex-col items-center justify-center h-[340px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.7, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.15 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center"
              >
                <span className={`font-display text-[92px] leading-none ${toneMap[step.tone]}`}>
                  {step.big}
                </span>
                {step.label ? (
                  <span className="mt-1 font-display text-[13px] tracking-[0.2em] text-white/50">
                    {step.label}
                  </span>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-3 px-6">
            <div className="w-11 h-11 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center">
              <div className="w-3 h-3 border-l-2 border-r-2 border-white/70" />
            </div>
            <div className="flex-1 h-11 rounded-full bg-accent flex items-center justify-center">
              <span className="text-[11px] font-bold tracking-wide text-white uppercase">Repeat Cue</span>
            </div>
            <div className="w-11 h-11 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center">
              <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[9px] border-l-white/70" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
