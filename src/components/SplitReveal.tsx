import { motion, useInView } from 'framer-motion';
import { createElement, useRef } from 'react';
import type { ReactNode } from 'react';

interface SplitRevealProps {
  children: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  by?: 'word' | 'char';
  delay?: number;
  stagger?: number;
  once?: boolean;
  /** 3D perspective rotation on reveal (deg). 0 = no 3D. */
  rotate3d?: number;
  /** When provided, override the scroll-triggered inView check.
   *  Use this for page-load entrance sequences so the reveal waits
   *  for an imperative signal instead of firing on first paint. */
  active?: boolean;
}

export function SplitReveal({
  children,
  as = 'h2',
  className = '',
  by = 'word',
  delay = 0,
  stagger = 0.045,
  once = true,
  rotate3d = 0,
  active,
}: SplitRevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once, margin: '-10% 0px -10% 0px' });

  const shouldAnimate = active !== undefined ? active : inView;

  const pieces = by === 'word' ? children.split(/(\s+)/) : children.split('');

  return createElement(
    as,
    { ref, className, 'aria-label': children, style: { perspective: rotate3d ? '1200px' : undefined } },
    pieces.map((piece, index) => {
      if (by === 'word' && /^\s+$/.test(piece)) {
        return piece;
      }
      return (
        <span
          key={index}
          style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top' }}
          aria-hidden="true"
        >
          <motion.span
            style={{ display: 'inline-block', transformStyle: 'preserve-3d' }}
            initial={{ y: '110%', rotate: rotate3d ? 15 : 4, rotateX: rotate3d ? 25 : 0 }}
            animate={shouldAnimate
              ? { y: '0%', rotate: 0, rotateX: 0 }
              : { y: '110%', rotate: rotate3d ? 15 : 4, rotateX: rotate3d ? 25 : 0 }
            }
            transition={{
              duration: 0.75,
              delay: delay + index * stagger,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {piece}
            {by === 'word' && index < pieces.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      );
    }),
  );
}

export function FadeUp({
  children,
  delay = 0,
  className = '',
  y = 24,
  active,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
  active?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px -10% 0px' });

  const shouldAnimate = active !== undefined ? active : inView;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
