import { useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MagneticButton } from './MagneticButton';
import { SplitReveal, FadeUp } from './SplitReveal';
import { scrollToId } from '../lib/scrollTo';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/scrollFx';
import AnimatedGradient from './AnimatedGradient';

export function Hero({ revealed }: { revealed?: boolean }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const lineARef = useRef<HTMLDivElement | null>(null);
  const lineBRef = useRef<HTMLDivElement | null>(null);
  const metaRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const common: ScrollTrigger.Vars = {
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
      };

      gsap.to(lineARef.current, { xPercent: -14, ease: 'none', scrollTrigger: common });
      gsap.to(lineBRef.current, { xPercent: 10, ease: 'none', scrollTrigger: { ...common } });
      gsap.to(metaRef.current, { opacity: 0, yPercent: -40, ease: 'none', scrollTrigger: { ...common, end: '40% top' } });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative min-h-[100svh] overflow-hidden pt-[76px] flex flex-col justify-between"
    >
      <div className="absolute inset-0 pointer-events-none z-[1] concrete-texture opacity-40" />
      <AnimatedGradient />

      {/* Meta row */}
      <div
        ref={metaRef}
        className="relative z-10 max-w-[1500px] w-full mx-auto px-6 md:px-10 pt-10 flex items-start justify-between text-[11px] font-semibold tracking-[0.2em] uppercase text-mute"
      >
        <FadeUp delay={0.1} active={revealed}>
          <span>Voice-led shadowboxing</span>
        </FadeUp>
        <FadeUp delay={0.2} active={revealed}>
          <span className="hidden sm:block">The number system, spoken live</span>
        </FadeUp>
        <FadeUp delay={0.3} active={revealed}>
          <span className="text-accent">iOS — 2026</span>
        </FadeUp>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-[1500px] w-full mx-auto px-6 md:px-10 flex-1 flex flex-col justify-center">
        {/* Single column — the WebGL glove owns the right half of the frame. */}
        <div className="max-w-[62rem]">
          <div className="relative z-10">
            <div ref={lineARef} className="will-change-transform" style={{ perspective: '1000px' }}>
              <SplitReveal
                as="h1"
                by="word"
                rotate3d={8}
                active={revealed}
                className="font-display text-[17vw] lg:text-[10.5vw] leading-[0.85] tracking-tight text-white uppercase"
              >
                Your corner.
              </SplitReveal>
            </div>
            <div ref={lineBRef} className="will-change-transform lg:pl-[8vw]" style={{ perspective: '1000px' }}>
              <SplitReveal
                as="h1"
                by="word"
                delay={0.12}
                rotate3d={8}
                active={revealed}
                className="font-display text-[17vw] lg:text-[10.5vw] leading-[0.85] tracking-tight text-white uppercase"
              >
                Anywhere.
              </SplitReveal>
            </div>

            <div className="mt-10 lg:mt-14 lg:pl-[8vw] max-w-xl">
              <FadeUp delay={0.5} active={revealed}>
                <p className="text-base md:text-lg text-mute leading-relaxed border-l border-accent/40 pl-5">
                  Real combinations, called live — <span className="text-white font-semibold">1, 2, 3</span> —
                  in the language every gym already speaks.
                </p>
              </FadeUp>
              <FadeUp delay={0.55} active={revealed} className="mt-4">
                <p className="text-sm text-mute/50 leading-relaxed pl-5 italic">
                  No camera. No wearable. Just a voice in your corner.
                </p>
              </FadeUp>
              <FadeUp delay={0.65} active={revealed} className="mt-8 flex flex-wrap items-center gap-4">
                <MagneticButton variant="solid" onClick={() => scrollToId('download')}>
                  Join the Waitlist
                </MagneticButton>
                <MagneticButton variant="outline" onClick={() => scrollToId('numbers')}>
                  See the system
                </MagneticButton>
              </FadeUp>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll prompt */}
      <div className="relative z-10 max-w-[1500px] w-full mx-auto px-6 md:px-10 pb-8">
        <FadeUp delay={0.9} active={revealed}>
          <div className="flex items-end justify-between border-t border-line pt-5">
            <div className="flex items-center gap-4">
              <motion.span
                className="block w-6 h-px bg-accent"
                initial={{ width: 0 }}
                animate={{ width: 24 }}
                transition={{ duration: 0.8, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
              />
              <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-caution">
                Scroll to begin
              </span>
            </div>
            <span className="font-display text-[10px] tracking-[0.15em] text-mute/60">01 / 06</span>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
