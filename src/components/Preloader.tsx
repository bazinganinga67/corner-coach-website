import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import logo from '../assets/logo.png';

const FILL_DURATION_MS = 1800;
const EXIT_DELAY_MS = 300;
const EXIT_DURATION_MS = 900;


export function Preloader({ onDone }: { onDone: () => void }) {
  const prefersReduced = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (prefersReduced) {
      onDone();
      return;
    }

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(100, Math.round((elapsed / FILL_DURATION_MS) * 100));
      setProgress(pct);
      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(() => setExiting(true), EXIT_DELAY_MS);
        setTimeout(onDone, EXIT_DELAY_MS + EXIT_DURATION_MS);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone, prefersReduced]);

  if (prefersReduced) {
    return null;
  }

  return (
    <AnimatePresence>
      {!exiting ? (
        <motion.div
          className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-ink"
          exit={{
            clipPath: 'inset(0% 0% 100% 0%)',
            transition: { duration: EXIT_DURATION_MS / 1000, ease: [0.76, 0, 0.24, 1] },
          }}
        >
          <motion.img
            src={logo}
            alt=""
            className="w-16 h-16 rounded-2xl mb-6 object-cover"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />

          <div className="w-[240px] h-[1px] bg-white/10 overflow-hidden rounded-full mb-4">
            <motion.div
              className="h-full bg-accent"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="font-display text-sm tracking-[0.3em] text-mute uppercase"
          >
            {String(progress).padStart(3, '0')}%
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
