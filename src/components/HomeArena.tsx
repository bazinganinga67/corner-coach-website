import { useLayoutEffect, useRef } from 'react';
import { SplitReveal, FadeUp } from './SplitReveal';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/scrollFx';

const callouts = [
  {
    text: 'Your phone stays in your pocket',
    x: 56,
    y: 20,
    align: 'left' as const,
  },
  {
    text: 'No camera angles to worry about',
    x: 18,
    y: 50,
    align: 'right' as const,
  },
];

export function HomeArena() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const floorRef = useRef<SVGRectElement | null>(null);
  const boundaryRef = useRef<SVGRectElement | null>(null);
  const figureRef = useRef<SVGGElement | null>(null);
  const arcLeftRef = useRef<SVGPathElement | null>(null);
  const arcRightRef = useRef<SVGPathElement | null>(null);
  const calloutRefs = useRef<(HTMLDivElement | null)[]>([]);
  const gridLinesRef = useRef<SVGLineElement[]>([]);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinRef.current,
          start: 'top top',
          end: '+=120%',
          pin: true,
          scrub: 1.2,
          anticipatePin: 1,
        },
      });

      tl.fromTo(
        floorRef.current,
        { strokeDashoffset: 960 },
        { strokeDashoffset: 0, duration: 1, ease: 'power2.out' },
      );

      tl.fromTo(
        boundaryRef.current,
        { opacity: 0, strokeDashoffset: 600 },
        { opacity: 1, strokeDashoffset: 0, duration: 0.8 },
        '-=0.4',
      );

      tl.fromTo(
        gridLinesRef.current,
        { opacity: 0 },
        { opacity: 0.6, duration: 0.6, stagger: 0.08 },
        '-=0.6',
      );

      tl.fromTo(
        figureRef.current,
        { opacity: 0, scale: 0.6 },
        { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.7)' },
        '-=0.4',
      );

      tl.fromTo(
        [arcLeftRef.current, arcRightRef.current],
        { opacity: 0, strokeDashoffset: 300 },
        { opacity: 1, strokeDashoffset: 0, duration: 1, ease: 'power2.out' },
        '-=0.4',
      );

      calloutRefs.current.forEach((el) => {
        if (el) {
          tl.fromTo(
            el,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
            '-=0.3',
          );
        }
      });
    }, pinRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="home-arena"
      className="relative bg-garage overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-32 md:pt-40 pb-8">
        <div className="max-w-3xl">
          <FadeUp>
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-caution">
              03 — Your Arena
            </span>
          </FadeUp>
          <SplitReveal
            as="h2"
            by="word"
            className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-chalk uppercase mt-4"
          >
            Any room is your ring.
          </SplitReveal>
          <FadeUp delay={0.3}>
            <p className="mt-6 text-lg text-mute leading-relaxed max-w-2xl border-l-2 border-caution pl-5">
              No sensors, no setup, no space requirements. Just you, your phone, and a voice in your ear.
            </p>
          </FadeUp>
        </div>
      </div>

      <div ref={pinRef} className="relative w-full min-h-[80svh] flex items-center justify-center overflow-hidden">
        <svg
          ref={svgRef}
          viewBox="0 0 800 600"
          className="w-full max-w-[800px] h-auto px-6 md:px-10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <line
                ref={(el) => { if (el) gridLinesRef.current.push(el); }}
                x1="40" y1="0" x2="40" y2="600"
                stroke="rgba(232,229,225,0.06)"
                strokeWidth="0.5"
              />
              <line
                ref={(el) => { if (el) gridLinesRef.current.push(el); }}
                x1="0" y1="40" x2="800" y2="40"
                stroke="rgba(232,229,225,0.06)"
                strokeWidth="0.5"
              />
            </pattern>
            <filter id="glow-caution">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="800" height="600" fill="url(#grid)" />

          <rect
            ref={floorRef}
            x="100" y="60"
            width="600" height="480"
            rx="8"
            stroke="rgba(232,229,225,0.35)"
            strokeWidth="1.5"
            strokeDasharray="960"
            strokeDashoffset="960"
            fill="rgba(232,229,225,0.02)"
          />

          <rect
            ref={boundaryRef}
            x="160" y="120"
            width="480" height="360"
            rx="4"
            stroke="#E8B506"
            strokeWidth="1"
            strokeDasharray="8 6"
            strokeDashoffset="600"
            opacity="0"
            fill="rgba(232,181,6,0.04)"
          />

          <g ref={figureRef} opacity="0">
            <circle cx="400" cy="300" r="18" stroke="rgba(232,229,225,0.5)" strokeWidth="1.5" fill="none" />
            <line x1="400" y1="318" x2="400" y2="370" stroke="rgba(232,229,225,0.5)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="400" y1="335" x2="370" y2="360" stroke="rgba(232,229,225,0.5)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="400" y1="335" x2="430" y2="360" stroke="rgba(232,229,225,0.5)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="400" y1="370" x2="380" y2="420" stroke="rgba(232,229,225,0.5)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="400" y1="370" x2="420" y2="420" stroke="rgba(232,229,225,0.5)" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          <path
            ref={arcLeftRef}
            d="M 340 282 A 60 60 0 0 0 340 318"
            stroke="#E8B506"
            strokeWidth="1.5"
            strokeDasharray="300"
            strokeDashoffset="300"
            opacity="0"
            fill="none"
            filter="url(#glow-caution)"
          />

          <path
            ref={arcRightRef}
            d="M 460 282 A 60 60 0 0 1 460 318"
            stroke="#E8B506"
            strokeWidth="1.5"
            strokeDasharray="300"
            strokeDashoffset="300"
            opacity="0"
            fill="none"
            filter="url(#glow-caution)"
          />

          {/* Dimension annotations */}
          <line x1="100" y1="560" x2="700" y2="560" stroke="rgba(232,229,225,0.15)" strokeWidth="0.5" />
          <line x1="100" y1="555" x2="100" y2="565" stroke="rgba(232,229,225,0.15)" strokeWidth="0.5" />
          <line x1="700" y1="555" x2="700" y2="565" stroke="rgba(232,229,225,0.15)" strokeWidth="0.5" />
          <text x="400" y="575" textAnchor="middle" fill="rgba(232,229,225,0.2)" fontSize="11" fontFamily="monospace">
            6 ft
          </text>
          <line x1="80" y1="60" x2="80" y2="540" stroke="rgba(232,229,225,0.15)" strokeWidth="0.5" />
          <line x1="75" y1="60" x2="85" y2="60" stroke="rgba(232,229,225,0.15)" strokeWidth="0.5" />
          <line x1="75" y1="540" x2="85" y2="540" stroke="rgba(232,229,225,0.15)" strokeWidth="0.5" />
          <text x="70" y="305" textAnchor="middle" fill="rgba(232,229,225,0.2)" fontSize="11" fontFamily="monospace" transform="rotate(-90 70 305)">
            6 ft
          </text>
        </svg>

        {/* Floating callouts */}
        {callouts.map((c, i) => (
          <div
            key={c.text}
            ref={(el) => { calloutRefs.current[i] = el; }}
            className={`absolute text-chalk/80 text-sm md:text-base font-semibold tracking-wide opacity-0 ${
              c.align === 'right' ? 'text-right' : 'text-left'
            }`}
            style={{
              left: `${c.x}%`,
              top: `${c.y}%`,
              transform: c.align === 'right' ? 'translateX(-100%)' : 'translateX(0)',
              textShadow: '0 0 20px rgba(232,181,6,0.15)',
            }}
          >
            <span className="inline-block border-l-2 border-caution pl-3">
              {c.text}
            </span>
          </div>
        ))}
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pb-32 md:pb-40">
        <div className="industrial-divider my-0" />
        <div className="grid sm:grid-cols-3 gap-6 mt-10">
          {[
            { title: 'Zero setup', detail: 'Open the app, press start, hands up. No sensors, no camera, no calibration.' },
            { title: 'Any space works', detail: 'A bedroom, a garage corner, a hotel room. If you can stand, you can train.' },
            { title: 'True shadowboxing', detail: 'No screen to watch. The coach is in your ears — your eyes stay on your hands.' },
          ].map((item) => (
            <FadeUp key={item.title} delay={0.1}>
              <div className="rounded-2xl border border-white/10 bg-panel/30 p-6 h-full backdrop-blur-sm">
                <div className="font-display text-lg text-chalk mb-2">{item.title}</div>
                <div className="text-sm text-mute leading-relaxed">{item.detail}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
