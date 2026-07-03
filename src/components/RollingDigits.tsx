import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';

const COLUMN = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

function DigitColumn({
  digit,
  delay,
  active,
  instant,
}: {
  digit: string;
  delay: number;
  active: boolean;
  instant: boolean;
}) {
  const target = COLUMN.indexOf(digit);
  return (
    <span className="inline-block overflow-hidden align-top" style={{ height: '1em' }}>
      <motion.span
        className="flex flex-col leading-none"
        initial={{ y: '0em' }}
        animate={active ? { y: `-${target}em` } : { y: '0em' }}
        transition={instant ? { duration: 0 } : { duration: 1.4, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {COLUMN.map((n) => (
          <span key={n} style={{ height: '1em' }} className="block leading-none">
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/**
 * Odometer-style number: each digit rolls down a 0-9 column to its
 * target when the element scrolls into view.
 */
export function RollingDigits({ value, className = '' }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: '-15% 0px' });
  const reduced = useReducedMotion();

  return (
    <span ref={ref} className={`inline-flex tabular-nums leading-none ${className}`} aria-label={value}>
      {value.split('').map((char, i) =>
        /\d/.test(char) ? (
          <DigitColumn
            key={i}
            digit={char}
            delay={i * 0.08}
            active={Boolean(inView) || Boolean(reduced)}
            instant={Boolean(reduced)}
          />
        ) : (
          <span key={i} className="leading-none">
            {char}
          </span>
        ),
      )}
    </span>
  );
}
