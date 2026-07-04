import { useEffect } from 'react';
import { Vector2 } from 'three';
import { ScrollTrigger } from '../lib/scrollFx';

/**
 * Centralized scene state — the single bridge between the DOM world
 * (Lenis scroll, pointer, section layout) and the 3D world.
 *
 * This is deliberately NOT React state. Every field is mutated in place and
 * read inside `useFrame` loops, so scroll/pointer updates never trigger a
 * React render. React re-renders are the number one 60fps killer in
 * scroll-driven R3F scenes; this store keeps the hot path allocation-free
 * and render-free.
 */

export interface SectionStop {
  id: string;
  /** Page-scroll progress (0..1) at which this section's camera shot is fully framed. */
  at: number;
}

/** Sections that own a camera shot, in page order. Must match DOM ids. */
export const SCENE_SECTION_IDS = [
  'top',
  'numbers',
  'how-it-works',
  'voice',
  'pricing',
  'download',
] as const;

export const sceneState = {
  /** Smoothed page scroll progress 0..1 (Lenis already eases the raw value). */
  scroll: 0,
  /** Low-passed scroll velocity in progress-units/second. Drives chromatic aberration. */
  velocity: 0,
  /** Pointer in NDC space: x right +1, y up +1. Consumers damp toward it themselves. */
  pointer: new Vector2(0, 0),
  /** False until the first pointermove — lets touch devices skip mouse-driven motion. */
  pointerActive: false,
  /** Measured camera keyframe stops, sorted by `at`. */
  stops: [] as SectionStop[],
  /** Bumped on every re-measure so frame loops can rebuild derived tracks cheaply. */
  stopsVersion: 0,
  activeShot: -1,
};

// Dev-only: lets you watch scroll/impact/shot state from the console.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__sceneState = sceneState;
}

function measureSections() {
  const total = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const stops: SectionStop[] = [];

  for (const id of SCENE_SECTION_IDS) {
    const el = document.getElementById(id);
    if (!el) continue;
    const top = el.getBoundingClientRect().top + window.scrollY;
    stops.push({ id, at: Math.min(1, Math.max(0, top / total)) });
  }

  stops.sort((a, b) => a.at - b.at);
  sceneState.stops = stops;
  sceneState.stopsVersion++;
}

/**
 * Installs the DOM listeners that feed the store. Mounted once by
 * SceneContainer (outside the Canvas — these are window-level concerns).
 *
 * Section offsets are re-measured on resize AND on ScrollTrigger refresh:
 * GSAP pinning (NumberShowcase) injects pin-spacers that change the page
 * height after first paint, and 'refresh' is the moment those settle.
 */
export function useSceneStateBindings() {
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      sceneState.pointer.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -((e.clientY / window.innerHeight) * 2 - 1),
      );
      sceneState.pointerActive = true;
    };

    const onResize = () => measureSections();

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', onResize);
    ScrollTrigger.addEventListener('refresh', measureSections);

    measureSections();
    // Fonts, the preloader, and pin-spacers can all shift layout shortly
    // after mount; one deferred re-measure catches anything refresh missed.
    const settle = window.setTimeout(measureSections, 600);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      ScrollTrigger.removeEventListener('refresh', measureSections);
      window.clearTimeout(settle);
    };
  }, []);
}
