import { motion } from 'framer-motion';

export default function AnimatedGradient() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 100% 80% at 40% 20%, #1a1410 0%, transparent 70%), radial-gradient(ellipse 80% 60% at 70% 80%, #0d0b12 0%, transparent 60%)',
        }}
        animate={{ opacity: [0.5, 0.6, 0.5] }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
