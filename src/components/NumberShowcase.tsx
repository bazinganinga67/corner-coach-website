import { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { SplitReveal, FadeUp } from './SplitReveal';
import { VelocityMarquee } from './VelocityMarquee';

import { gsap, isDesktop, prefersReducedMotion } from '../lib/scrollFx';

const punches = [
  { num: '1', label: 'Jab', copy: 'The range-finder. Everything starts here.' },
  { num: '2', label: 'Cross', copy: 'Your power, straight down the middle.' },
  { num: '3', label: 'Left Hook', copy: 'Short and tight, around the guard.' },
  { num: '4', label: 'Right Hook', copy: 'The counter they never see coming.' },
  { num: '5', label: 'Left Uppercut', copy: 'Up through the middle at close range.' },
  { num: '6', label: 'Right Uppercut', copy: 'The finisher.' },
];

function HorizontalGallery() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const ctx = gsap.context(() => {
      const distance = () => track.scrollWidth - window.innerWidth;

      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${distance()}`,
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (progressRef.current) {
              gsap.set(progressRef.current, { scaleX: self.progress });
            }
          },
        },
      });


    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef} className="relative h-[100svh] overflow-hidden">
      <div ref={trackRef} className="flex h-full w-max will-change-transform">
        {punches.map((punch, i) => (
          <div
            key={punch.num}
            className="relative flex h-[100svh] w-[72vw] max-w-[880px] shrink-0 items-center border-r border-line px-[6vw]"
          >

            <div className="relative">
              <span className="font-display text-sm tracking-[0.3em] text-mute">
                0{i + 1} — PUNCH
              </span>
              <span className="mt-4 font-display text-4xl md:text-5xl uppercase tracking-tight text-white/90 block">
                {punch.label}
              </span>
              <p className="mt-6 max-w-sm text-mute leading-relaxed border-l-2 border-accent pl-5">
                {punch.copy}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Scrub progress rail */}
      <div className="absolute bottom-10 left-[6vw] right-[6vw]">
        <div className="h-px bg-white/15">
          <div ref={progressRef} className="h-px origin-left scale-x-0 bg-accent" />
        </div>
      </div>
    </div>
  );
}

function GridFallback() {
  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 pb-24">
      {punches.map((punch, i) => (
        <FadeUp key={punch.num} delay={i * 0.06}>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-white/[0.02] py-10">
            <span className="font-display text-7xl leading-none text-white">{punch.num}</span>
            <span className="mt-3 font-display text-sm tracking-[0.2em] uppercase text-mute">
              {punch.label}
            </span>
          </div>
        </FadeUp>
      ))}
    </div>
  );
}

export function NumberShowcase() {
  const [horizontal, setHorizontal] = useState(false);

  useLayoutEffect(() => {
    setHorizontal(isDesktop() && !prefersReducedMotion());
  }, []);

  return (
    <section id="numbers" className="relative bg-ink/55 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-32 md:pt-40 pb-16 md:pb-20">
        <div className="max-w-3xl">
          <FadeUp>
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-accent">
              01 — The System
            </span>
          </FadeUp>
          <SplitReveal
            as="h2"
            by="word"
            className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-white uppercase mt-4"
          >
            Six numbers. Every combination.
          </SplitReveal>
          <FadeUp delay={0.3}>
            <p className="mt-6 text-lg text-mute leading-relaxed max-w-2xl">
              No made-up app language. Corner Coach calls punches the way real trainers do — a number
              for every strike, so what you hear in your ears matches what you already know on the bag.
            </p>
          </FadeUp>
        </div>
      </div>

      {horizontal ? <HorizontalGallery /> : <GridFallback />}

      <div className="border-y border-line py-8 mt-0">
        <FadeUp className="max-w-[1400px] mx-auto px-6 md:px-10 mb-6">
          <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-mute">
            Defense &amp; movement stay exactly what they are
          </span>
        </FadeUp>
        <VelocityMarquee text="BLOCK — PIVOT — SLIP — ROLL — CATCH — PARRY — STEP — FEINT —" />
      </div>
    </section>
  );
}
