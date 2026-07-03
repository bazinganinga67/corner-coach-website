import { useRef } from 'react';
import type { MouseEvent } from 'react';

/**
 * 3D tilt-on-hover for cards. Rotates around X/Y based on cursor position
 * relative to the card center, with a subtle glare-position side effect
 * exposed via CSS custom properties.
 */
export function useTilt<T extends HTMLElement>(max = 10) {
  const ref = useRef<T | null>(null);

  const onMouseMove = (event: MouseEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * max * 2;
    const rotateX = (0.5 - py) * max * 2;
    el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`;
    el.style.setProperty('--glare-x', `${px * 100}%`);
    el.style.setProperty('--glare-y', `${py * 100}%`);
  };

  const onMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
  };

  return { ref, onMouseMove, onMouseLeave };
}
