import { useLayoutEffect, useRef } from 'react';
import { SplitReveal, FadeUp } from './SplitReveal';
import { gsap, prefersReducedMotion } from '../lib/scrollFx';

const steps = [
  {
    tag: 'Setup',
    title: 'Pick the round, not the settings',
    copy: 'Rounds, round length, rest, mode, stance, difficulty. Set it once in seconds, or hit Start Now and let the coach decide.',
  },
  {
    tag: 'Live',
    title: 'Hands up. The coach calls it.',
    copy: 'Real combinations arrive on their own clock — spaced by your pace, difficulty, and how long the last call took to say.',
  },
  {
    tag: 'React',
    title: 'Numbers for punches. Words for everything else.',
    copy: '"1, 2, 3" lands as fast, clean audio. Defense and footwork stay spoken as Block, Slip, Pivot — no translation required.',
  },
  {
    tag: 'Debrief',
    title: 'Every round ends with a read',
    copy: 'Combos thrown, defense called, intensity score, and a coach note that tells you exactly what to train next.',
  },
  {
    tag: 'Focus',
    title: 'Your phone stays in your pocket',
    copy: 'The coach works through your earbuds with the screen off and silent mode on. No camera, no wearable, no distraction — just you and the call.',
  },
  {
    tag: 'Freedom',
    title: 'Any room is your ring',
    copy: 'No setup, no space requirements, no camera angles. A bedroom corner, a garage, a hotel room. If you can stand, you can train.',
  },
];

export function HowItWorks() {
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    cardsRef.current.forEach((el, i) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 80%',
            end: 'top 40%',
            toggleActions: 'play none none reverse',
          },
        },
      );
    });
  }, []);

  return (
    <section id="how-it-works" className="relative py-32 md:py-40 bg-surface/85">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="max-w-3xl mb-20">
          <FadeUp>
            <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-mute/60">
              02 — How it works
            </span>
          </FadeUp>
          <SplitReveal
            as="h2"
            by="word"
            className="font-display text-4xl md:text-6xl leading-[0.95] tracking-tight text-white uppercase mt-4"
          >
            From setup to sharp in six moves.
          </SplitReveal>
          <FadeUp delay={0.2}>
            <p className="mt-5 text-base md:text-lg text-mute leading-relaxed max-w-xl border-l border-accent/40 pl-5">
              Set your round. The coach calls the shots. Every session ends with a read.
            </p>
          </FadeUp>
        </div>

        <div className="grid md:grid-cols-2 gap-x-16 gap-y-16">
          {steps.map((step, i) => (
            <div
              key={step.tag}
              ref={(el) => { if (el) cardsRef.current[i] = el; }}
              className="relative pl-10 md:pl-14"
            >
              <div className="absolute left-0 top-2 bottom-2 bg-line" style={{ width: '0.5px' }}>
                <div className="w-full h-full bg-accent origin-top" style={{ transform: 'scaleY(0)' }} />
              </div>

              <div className="w-3 h-3 rounded-full bg-accent absolute left-0 top-2 -translate-x-[5px]" />

              <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-accent/80">
                0{i + 1} — {step.tag}
              </span>
              <h3 className="font-display text-2xl md:text-3xl leading-[1.1] tracking-tight text-white mt-2 mb-3">
                {step.title}
              </h3>
              <p className="text-base md:text-lg text-mute leading-relaxed max-w-lg">
                {step.copy}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
