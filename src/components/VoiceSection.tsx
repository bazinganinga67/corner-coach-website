import { AnimatePresence, motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { SplitReveal, FadeUp } from './SplitReveal';

type Style = 'calm' | 'energetic' | 'minimal';

const styleConfig: Record<Style, { interval: number; label: string; copy: string; sample: string }> = {
  calm: {
    interval: 2200,
    label: 'Calm',
    copy: 'Even tone, longer breaths between calls. Built for technique work and long solo rounds.',
    sample: '"One… two… left hook."',
  },
  energetic: {
    interval: 1100,
    label: 'Energetic',
    copy: 'Sharper hits, tighter gaps, exclamation on every call. Built to push pace and finish rounds strong.',
    sample: '"1, 2, 3! Work!"',
  },
  minimal: {
    interval: 3000,
    label: 'Minimal',
    copy: 'Just the number. No filler, no commentary — for fighters who only want the cue.',
    sample: '"3."',
  },
};

const cues: Record<Style, string[]> = {
  calm: ['Jab', 'Cross', 'Left hook', 'Block', 'Slip', 'Jab-cross'],
  energetic: ['JAB!', 'CROSS!', 'LEFT HOOK!', 'SLIP!', '1-2-3!', 'WORK!'],
  minimal: ['1', '2', '3', '4', 'Slip', 'Pivot'],
};

export function VoiceSection() {
  const [style, setStyle] = useState<Style>('energetic');
  const [cueIndex, setCueIndex] = useState(0);
  const config = styleConfig[style];

  useEffect(() => {
    const timer = setInterval(() => {
      setCueIndex((prev) => (prev + 1) % cues[style].length);
    }, config.interval);
    return () => clearInterval(timer);
  }, [style, config.interval]);

  return (
    <section id="voice" className="relative py-32 md:py-40 bg-ink/55 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 relative">
        <div className="max-w-3xl mb-16">
          <FadeUp>
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-accent">
              03 — The Voice
            </span>
          </FadeUp>
          <SplitReveal
            as="h2"
            by="word"
            className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-white uppercase mt-4"
          >
            A coach in your ear, not a screen.
          </SplitReveal>
          <FadeUp delay={0.3}>
            <p className="mt-6 text-lg text-mute leading-relaxed max-w-2xl">
              Premium on-device voices, tuned pacing for every difficulty, and a corner that always talks —
              even with your phone locked and the ringer off.
            </p>
          </FadeUp>
        </div>

        <div className="rounded-[32px] border border-line bg-panel/50 p-8 md:p-14">
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            {(Object.keys(styleConfig) as Style[]).map((key) => (
              <button
                key={key}
                onClick={() => setStyle(key)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 ${
                  style === key
                    ? 'bg-accent text-white'
                    : 'border border-white/15 text-mute hover:text-white hover:border-white/40'
                }`}
              >
                {styleConfig[key].label}
              </button>
            ))}
          </div>

          <div className="relative flex items-center justify-center h-28 md:h-32">
            <AnimatePresence mode="wait">
              <motion.span
                key={`${style}-${cueIndex}`}
                initial={{ opacity: 0, scale: 0.6, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.3, y: -20 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-5xl md:text-6xl text-white select-none"
                style={{ textShadow: '0 0 40px rgba(255,46,62,0.15)' }}
              >
                {cues[style][cueIndex]}
              </motion.span>
            </AnimatePresence>
          </div>

          <motion.div
            key={style}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mt-6"
          >
            <div className="font-display text-3xl md:text-4xl text-white mb-3">{config.sample}</div>
            <p className="text-mute max-w-md mx-auto leading-relaxed">{config.copy}</p>
          </motion.div>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 mt-10">
          {[
            { title: 'Plays through silent mode', detail: 'The coach never goes quiet — even with the ring switch off.' },
            { title: 'Premium device voices', detail: 'Prefers the best enhanced voice already on your iPhone.' },
            { title: 'No repeated lines', detail: 'Round starts, rest, and warnings rotate so it never feels robotic.' },
          ].map((item) => (
            <FadeUp key={item.title} delay={0.1}>
              <div className="rounded-2xl border border-line p-6 h-full">
                <div className="font-display text-lg text-white mb-2">{item.title}</div>
                <div className="text-sm text-mute leading-relaxed">{item.detail}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
