import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './scrollFx';

let sharedLenis: Lenis | null = null;

export function getLenis() {
  return sharedLenis;
}

export function useLenis() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });
    sharedLenis = lenis;

    // Keep ScrollTrigger's measurements in sync with Lenis-driven scroll.
    lenis.on('scroll', ScrollTrigger.update);

    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
      sharedLenis = null;
    };
  }, []);
}
