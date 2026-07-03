import { useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { SplitReveal, FadeUp } from './SplitReveal';
import { gsap, prefersReducedMotion } from '../lib/scrollFx';

const rows = [
  { feature: 'Calls real boxing numbers, live', generic: false, coach: true },
  { feature: 'Needs a camera or wearable', generic: true, coach: false },
  { feature: 'Adapts pace to your experience level', generic: false, coach: true },
  { feature: 'Works with your phone locked, silent switch on', generic: false, coach: true },
  { feature: 'Sells your data or shows ads', generic: true, coach: false },
  { feature: 'Ends every round with a coaching read', generic: false, coach: true },
];

function AnimatedCheckmark() {
  return (
    <motion.span
      className="inline-flex w-7 h-7 rounded-full bg-accent/15 text-accent items-center justify-center"
      initial={{ scale: 0 }}
      whileInView={{ scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
        <motion.path
          d="M1 5.5L5 9.5L13 1.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
    </motion.span>
  );
}

function AnimatedCross() {
  return (
    <motion.span
      className="inline-flex w-7 h-7 rounded-full bg-white/5 text-mute/50 items-center justify-center"
      initial={{ scale: 0 }}
      whileInView={{ scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <motion.path
          d="M1 1L10 10M10 1L1 10"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
    </motion.span>
  );
}

function Mark({ on }: { on: boolean }) {
  return on ? <AnimatedCheckmark /> : <AnimatedCross />;
}

export function Comparison() {
  const sectionRef = useRef<HTMLElement>(null!);
  const rowsRef = useRef<HTMLDivElement[]>([]);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    rowsRef.current.forEach((el, i) => {
      gsap.fromTo(
        el,
        { opacity: 0, rotationX: 40, y: 40, transformPerspective: 800 },
        {
          opacity: 1,
          rotationX: 0,
          y: 0,
          duration: 0.8,
          delay: i * 0.06,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            end: 'top 40%',
            toggleActions: 'play none none reverse',
          },
        },
      );
    });
  }, []);

  return (
    <section ref={sectionRef} className="relative py-32 md:py-40 bg-ink/70">
      <div className="max-w-[1000px] mx-auto px-6 md:px-10">
        <div className="max-w-2xl mb-16">
          <FadeUp>
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-accent">
              05 — Why it's different
            </span>
          </FadeUp>
          <SplitReveal
            as="h2"
            by="word"
            className="font-display text-5xl md:text-6xl leading-[0.95] tracking-tight text-white uppercase mt-4"
          >
            Not another fitness app.
          </SplitReveal>
        </div>

        <div className="rounded-3xl border border-line overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto] bg-white/[0.02] px-6 md:px-8 py-4 text-xs font-semibold uppercase tracking-wider text-mute">
            <span />
            <span className="w-20 text-center">Generic</span>
            <span className="w-24 text-center text-white">Corner Coach</span>
          </div>
          {rows.map((row, i) => (
            <div
              key={row.feature}
              ref={(el) => { if (el) rowsRef.current[i] = el; }}
              style={{ perspective: '800px' }}
            >
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                whileHover={{ backgroundColor: 'rgba(255,46,62,0.03)' }}
                className="grid grid-cols-[1fr_auto_auto] items-center px-6 md:px-8 py-5 border-t border-line transition-colors duration-300"
              >
                <span className="text-sm md:text-base text-white/90 pr-4">{row.feature}</span>
                <span className="w-20 flex justify-center">
                  <Mark on={row.generic} />
                </span>
                <span className="w-24 flex justify-center">
                  <Mark on={row.coach} />
                </span>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
