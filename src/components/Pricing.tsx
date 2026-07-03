import { useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';

import { MagneticButton } from './MagneticButton';
import { SplitReveal, FadeUp } from './SplitReveal';
import { scrollToId } from '../lib/scrollTo';
import { gsap, prefersReducedMotion } from '../lib/scrollFx';

interface Plan {
  name: string;
  price: string;
  cadence: string;
  badge?: string;
  featured?: boolean;
  features: string[];
}

const plans: Plan[] = [
  {
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    features: [
      '1 coached session per day',
      'Beginner & technical modes',
      '7-day progress history',
      'Full number-system coaching',
    ],
  },
  {
    name: 'Pro',
    price: '$9.99',
    cadence: 'per month',
    badge: 'Most popular',
    featured: true,
    features: [
      'Unlimited coached sessions',
      'Every workout mode & drill',
      'Full progress history',
      'Smarter round debriefs',
      'Or $79.99 billed annually',
    ],
  },
  {
    name: 'Elite',
    price: '$19.99',
    cadence: 'per month',
    features: [
      'Everything in Pro',
      'Fight-camp training blocks',
      'Advanced personalization',
      'Deepest progress insights',
    ],
  },
];

function PricingCard({ plan, index }: { plan: Plan; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className={`relative rounded-[28px] p-8 md:p-10 border transition-shadow duration-500 ${
        plan.featured
          ? 'bg-accent/[0.06] border-accent/50 shadow-[0_0_30px_-10px_rgba(255,46,62,0.3)]'
          : 'bg-panel/40 border-line hover:border-accent/30 hover:shadow-[0_0_40px_-15px_rgba(255,46,62,0.15)]'
      }`}
    >
      {plan.badge ? (
        <span className="absolute -top-3 left-8 bg-accent text-white text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full">
          {plan.badge}
        </span>
      ) : null}

      <div className="text-sm font-semibold uppercase tracking-[0.14em] text-mute mb-6">{plan.name}</div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-display text-5xl text-white">{plan.price}</span>
        <span className="text-mute text-sm">/{plan.cadence.replace('per ', '')}</span>
      </div>

      <ul className="mt-8 flex flex-col gap-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-mute">
            <span className="mt-1.5 w-1 h-1 rounded-full bg-accent shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <MagneticButton
        variant={plan.featured ? 'solid' : 'outline'}
        className="w-full mt-10 justify-center"
        onClick={() => scrollToId('download')}
      >
        {plan.name === 'Free' ? 'Start Free' : `Get ${plan.name}`}
      </MagneticButton>
    </motion.div>
  );
}

export function Pricing() {
  const gridRef = useRef<HTMLDivElement>(null!);

  useLayoutEffect(() => {
    if (prefersReducedMotion() || !gridRef.current) return;

    const cards = gridRef.current.querySelectorAll<HTMLElement>('[data-3d-card]');
    cards.forEach((card) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            end: 'top 40%',
            toggleActions: 'play none none reverse',
          },
        },
      );
    });
  }, []);

  return (
    <section id="pricing" className="relative py-32 md:py-40 bg-surface/85">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="max-w-3xl mb-16 text-center mx-auto">
          <FadeUp>
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-accent">
              04 — Pricing
            </span>
          </FadeUp>
          <SplitReveal
            as="h2"
            by="word"
            className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-white uppercase mt-4"
          >
            Free is a real workout.
          </SplitReveal>
          <FadeUp delay={0.3}>
            <p className="mt-6 text-lg text-mute leading-relaxed">
              Pro removes the limit. Elite builds the camp. No ads, no data selling, ever.
            </p>
          </FadeUp>
        </div>

        <div ref={gridRef} className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <div key={plan.name} data-3d-card>
              <PricingCard plan={plan} index={i} />
            </div>
          ))}
        </div>

        <FadeUp delay={0.4}>
          <p className="text-center text-xs text-mute/60 mt-10">
            Corner Coach is in final development. Pricing reflects planned launch tiers and is subject to
            change before release on the App Store.
          </p>
        </FadeUp>
      </div>
    </section>
  );
}
