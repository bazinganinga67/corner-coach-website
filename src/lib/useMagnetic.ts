import { useRef } from 'react';
import type { MouseEvent } from 'react';

/**
 * Magnetic hover: the element eases toward the cursor within its bounds,
 * then springs back on leave. Strength controls max travel in pixels.
 */
export function useMagnetic<T extends HTMLElement>(strength = 22) {
  const ref = useRef<T | null>(null);

  const onMouseMove = (event: MouseEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = event.clientX - (rect.left + rect.width / 2);
    const relY = event.clientY - (rect.top + rect.height / 2);
    const x = (relX / rect.width) * strength;
    const y = (relY / rect.height) * strength;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const onMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
    el.style.transform = 'translate3d(0, 0, 0)';
    // Clear transition after animation completes so hover re-engages instantly
    setTimeout(() => { el.style.transition = ''; }, 500);
  };

  return { ref, onMouseMove, onMouseLeave };
}
