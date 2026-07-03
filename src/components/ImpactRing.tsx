import { motion } from 'framer-motion';
import { useRef } from 'react';

export function ImpactRing({ delay = 0 }: { delay?: number }) {
  const ref = useRef<HTMLDivElement>(null!);

  return (
    <motion.div
      ref={ref}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      aria-hidden="true"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute rounded-full border border-accent/30"
          style={{ width: '60%', height: '60%' }}
          initial={{ scale: 0, opacity: 0.6 }}
          whileInView={{
            scale: [0, 2.5, 3],
            opacity: [0.5, 0.1, 0],
          }}
          viewport={{ once: true }}
          transition={{
            duration: 1.2,
            delay: delay + i * 0.2,
            ease: 'easeOut',
          }}
        />
      ))}
    </motion.div>
  );
}

export function EnergyParticles() {
  const particles = Array.from({ length: 8 }, (_, i) => ({
    angle: (i / 8) * Math.PI * 2,
    distance: 40 + Math.random() * 60,
    size: 2 + Math.random() * 3,
    delay: Math.random() * 0.5,
  }));

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-accent"
          style={{
            width: p.size,
            height: p.size,
          }}
          initial={{ x: 0, y: 0, opacity: 0 }}
          whileInView={{
            x: [0, Math.cos(p.angle) * p.distance],
            y: [0, Math.sin(p.angle) * p.distance],
            opacity: [0, 0.6, 0],
          }}
          viewport={{ once: true }}
          transition={{
            duration: 1 + Math.random() * 0.5,
            delay: p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}
