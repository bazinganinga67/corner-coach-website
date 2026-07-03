import type { MouseEvent, ReactNode } from 'react';
import { useCallback, useRef } from 'react';
import { useMagnetic } from '../lib/useMagnetic';

interface MagneticButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'solid' | 'outline' | 'ghost';
  small?: boolean;
  icon?: ReactNode;
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export function MagneticButton({
  children,
  onClick,
  href,
  variant = 'solid',
  small = false,
  icon,
  className = '',
  type = 'button',
  disabled = false,
}: MagneticButtonProps) {
  const { ref, onMouseMove, onMouseLeave } = useMagnetic(14);
  const buttonRef = useRef<HTMLElement | null>(null);

  const onMouseDown = useCallback(() => {
    const el = (ref as React.RefObject<HTMLElement>).current;
    if (!el) return;
    el.style.transform = 'scale(0.97)';
    el.style.filter = 'brightness(0.9)';
    el.style.transition = 'transform 0.08s ease, filter 0.08s ease';
  }, [ref]);

  const onMouseUp = useCallback(() => {
    const el = (ref as React.RefObject<HTMLElement>).current;
    if (!el) return;
    el.style.transform = '';
    el.style.filter = '';
  }, [ref]);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (disabled) return;
      const el = (ref as React.RefObject<HTMLElement>).current;
      if (el) {
        el.classList.remove('impact-shake');
        // Force reflow
        void el.offsetWidth;
        el.classList.add('impact-shake');
      }
      onClick?.();
    },
    [disabled, onClick, ref],
  );

  const base =
    'relative inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-wide transition-[background-color,border-color,color] duration-300 ease-out will-change-transform overflow-hidden select-none';
  const size = small ? 'px-5 py-2.5 text-[13px]' : 'px-8 py-4 text-[15px]';

  const variants: Record<string, string> = {
    solid:
      'bg-white/[0.07] text-white border border-white/[0.12] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-white/[0.14] hover:border-white/[0.25]',
    outline: 'border border-white/25 text-white hover:border-white/70 bg-white/[0.02]',
    ghost: 'text-white/80 hover:text-white',
  };

  const Comp = href ? 'a' : 'button';

  return (
    <Comp
      ref={ref as never}
      href={href}
      type={href ? undefined : type}
      disabled={href ? undefined : disabled}
      aria-disabled={disabled || undefined}
      onClick={handleClick}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      className={`${base} ${size} ${variants[variant]} ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}
    >
      {children}
      {icon}
    </Comp>
  );
}
