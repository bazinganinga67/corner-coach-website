import { useEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../lib/scrollFx';
import { getLenis } from '../lib/useLenis';

interface VelocityMarqueeProps {
  text: string;
  className?: string;
  /** Base drift in percent-of-track per second. */
  baseSpeed?: number;
  outline?: boolean;
}

/**
 * Infinite text band whose speed and skew react to scroll velocity —
 * scroll fast and the type whips past and shears; stop and it settles
 * back to a slow drift. GSAP-ticker driven, no CSS keyframes.
 */
export function VelocityMarquee({
  text,
  className = '',
  baseSpeed = 4,
  outline = true,
}: VelocityMarqueeProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    const wrap = wrapRef.current;
    if (!track || !wrap) return;
    if (prefersReducedMotion()) return;

    let x = 0;
    let skew = 0;

    const onTick = (_time: number, deltaTime: number) => {
      const velocity = getLenis()?.velocity ?? 0;
      const dt = deltaTime / 1000;

      // Scroll velocity adds to the drift; direction follows the scroll.
      const boost = gsap.utils.clamp(-40, 40, velocity * 0.045);
      x -= (baseSpeed + boost) * dt;
      // The track holds two copies of the text, so -50% is one full copy.
      x = gsap.utils.wrap(-50, 0, x);
      gsap.set(track, { xPercent: x });

      const targetSkew = gsap.utils.clamp(-6, 6, velocity * 0.012);
      skew += (targetSkew - skew) * Math.min(1, dt * 8);
      gsap.set(wrap, { skewX: skew });
    };

    gsap.ticker.add(onTick);
    return () => gsap.ticker.remove(onTick);
  }, [baseSpeed]);

  const copy = `${text} `;

  return (
    <div ref={wrapRef} className={`overflow-hidden select-none ${className}`} aria-hidden="true">
      <div ref={trackRef} className="flex w-max whitespace-nowrap will-change-transform">
        {[0, 1].map((i) => (
          <span
            key={i}
            className={`font-display leading-[0.9] tracking-tight pr-8 text-[13vw] md:text-[9vw] ${
              outline
                ? 'text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.22)]'
                : 'text-white'
            }`}
          >
            {copy}
          </span>
        ))}
      </div>
    </div>
  );
}
