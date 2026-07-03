import { useLayoutEffect, useRef } from 'react';
import logo from '../assets/logo.png';
import { scrollToId } from '../lib/scrollTo';
import { gsap, prefersReducedMotion } from '../lib/scrollFx';

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'The System', id: 'numbers' },
      { label: 'How It Works', id: 'how-it-works' },
      { label: 'Voice Coaching', id: 'voice' },
      { label: 'Pricing', id: 'pricing' },
    ],
  },
];

export function Footer() {
  const footerRef = useRef<HTMLElement | null>(null);
  const bigTypeRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      // The giant wordmark rises out of the fold as the footer scrolls in.
      gsap.fromTo(
        bigTypeRef.current,
        { yPercent: 55 },
        {
          yPercent: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top bottom',
            end: 'bottom bottom',
            scrub: 0.8,
          },
        },
      );
    }, footerRef);
    return () => ctx.revert();
  }, []);

  return (
    <footer ref={footerRef} className="relative border-t border-line bg-ink pt-20 pb-10 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row justify-between gap-14 mb-20">
          <div className="max-w-sm">
            <div className="flex items-center gap-3 mb-6">
              <img src={logo} alt="Corner Coach" className="w-10 h-10 rounded-xl object-cover" />
              <span className="font-display text-2xl text-white">
                CORNER<span className="text-accent">COACH</span>
              </span>
            </div>
            <p className="text-sm text-mute leading-relaxed">
              Voice-led shadowboxing for solo training. Real numbers, real combinations, no camera
              required.
            </p>
          </div>

          <div className="flex gap-16">
            {columns.map((col) => (
              <div key={col.title}>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-mute mb-4">
                  {col.title}
                </div>
                <ul className="flex flex-col gap-3">
                  {col.links.map((link) => (
                    <li key={link.id}>
                      <button
                        onClick={() => scrollToId(link.id)}
                        className="text-sm text-white/80 hover:text-white transition-colors"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden mb-10">
          <div
            ref={bigTypeRef}
            className="font-display leading-[0.8] text-[12vw] md:text-[7rem] text-white/5 select-none whitespace-nowrap will-change-transform"
          >
            CORNER COACH
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-line text-xs text-mute/60">
          <span>© {new Date().getFullYear()} Corner Coach. All rights reserved.</span>
          <span>Built for boxers, by boxers.</span>
        </div>
      </div>
    </footer>
  );
}
