import { getLenis } from './useLenis';

/**
 * Scrolls to an element by id, routed through Lenis when it's active so the
 * smooth-scroll engine doesn't fight a native scrollIntoView/scrollTo call.
 */
export function scrollToId(id: string, offset = -24) {
  const el = document.getElementById(id);
  if (!el) return;

  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(el, { offset, duration: 1.2 });
  } else {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}
