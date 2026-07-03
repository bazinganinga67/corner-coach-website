import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { useState } from 'react';
import type { MouseEvent } from 'react';
import logo from '../assets/logo.png';
import { MagneticButton } from './MagneticButton';
import { scrollToId } from '../lib/scrollTo';

const links = [
  { label: 'The System', id: 'numbers' },
  { label: 'How It Works', id: 'how-it-works' },
  { label: 'Voice', id: 'voice' },
  { label: 'Pricing', id: 'pricing' },
];

export function Navbar() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    setScrolled(latest > 20);
    if (latest > previous && latest > 200) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  const onLogoClick = (e: MouseEvent) => {
    e.preventDefault();
    scrollToId('top');
  };

  return (
    <motion.header
      animate={{ y: hidden ? '-110%' : '0%' }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-[90] transition-colors duration-500 ${
        scrolled
          ? 'bg-ink/70 backdrop-blur-xl border-b border-line'
          : 'bg-transparent'
      }`}
    >

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-[76px] flex items-center justify-between">
        <a href="#top" onClick={onLogoClick} className="flex items-center gap-3 group">
          <img src={logo} alt="Corner Coach" className="w-9 h-9 rounded-lg object-cover" />
          <span className="font-display text-xl tracking-wide text-white">
            CORNER<span className="text-accent">COACH</span>
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-10">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToId(link.id)}
              onMouseEnter={() => setHoveredLink(link.id)}
              onMouseLeave={() => setHoveredLink(null)}
              className="relative text-[13px] font-semibold tracking-[0.12em] uppercase text-mute hover:text-white transition-colors duration-200"
            >
              {link.label}
              <span
                className={`absolute -bottom-1 left-0 right-0 h-px bg-accent transition-opacity duration-200 ${
                  hoveredLink === link.id ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </button>
          ))}
        </nav>

        <MagneticButton onClick={() => scrollToId('download')} variant="solid" small>
          Get The App
        </MagneticButton>
      </div>
    </motion.header>
  );
}
