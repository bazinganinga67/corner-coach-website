import { useLayoutEffect, useRef } from 'react';
import { RollingDigits } from './RollingDigits';
import { FadeUp } from './SplitReveal';
import { gsap, prefersReducedMotion } from '../lib/scrollFx';

const stats = [
  { value: '101', label: 'Real combinations', detail: 'from jabs to power hooks' },
  { value: '12', label: 'Combo categories', detail: 'covering every fight scenario' },
  { value: '6', label: 'Numbered punches', detail: 'the universal boxing language' },
  { value: '3', label: 'Coaching voices', detail: 'calm, energetic, or minimal' },
];

export function Stats() {
  const sectionRef = useRef<HTMLDivElement>(null!);
  const itemsRef = useRef<HTMLDivElement[]>([]);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    itemsRef.current.forEach((el, i) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power2.out', /* custom cubic-bezier(0.16, 1, 0.3, 1) */
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            end: 'top 45%',
            toggleActions: 'play none none reverse',
          },
        },
      );
    });
  }, []);

  return (
    <section ref={sectionRef} className="relative border-b border-line bg-surface/80 py-24 md:py-28 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <FadeUp>
          <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-mute">
            By the numbers
          </span>
        </FadeUp>

        <FadeUp delay={0.1}>
          <h2 className="font-display text-4xl md:text-5xl leading-[0.95] tracking-tight text-white uppercase mb-14 mt-3">
            Built for real rounds,<br />proven in the gym.
          </h2>
        </FadeUp>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              ref={(el) => { if (el) itemsRef.current[i] = el; }}

            >
              <RollingDigits
                value={stat.value}
                className="font-display text-6xl md:text-7xl tracking-tight text-white"
              />
              <div className="mt-3 text-sm font-semibold tracking-[0.14em] uppercase text-white/80">
                {stat.label}
              </div>
              <div className="mt-1 text-xs text-mute/60">{stat.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
