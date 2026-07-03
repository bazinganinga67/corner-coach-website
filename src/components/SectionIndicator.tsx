import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

export function SectionIndicator() {
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });
  const num = useTransform(smooth, [0, 0.9], [1, 6]);
  const display = useTransform(num, (v) => String(Math.round(v)).padStart(2, '0'));

  return (
    <div className="fixed left-6 md:left-10 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col items-center gap-3 pointer-events-none select-none">
      <motion.span className="font-display text-lg text-accent tabular-nums leading-none">
        {display}
      </motion.span>
      <motion.div
        className="w-12 h-px bg-accent/60 origin-left"
        style={{ scaleX: smooth }}
      />
      <span className="font-display text-lg text-mute/30 tabular-nums leading-none">06</span>
    </div>
  );
}
