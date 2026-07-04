import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { SplitReveal, FadeUp } from './SplitReveal';
import { MagneticButton } from './MagneticButton';

type Status = 'idle' | 'sending' | 'done' | 'error';

// Mailchimp embedded-form action URL — the one that looks like
// https://xxxx.usXX.list-manage.com/subscribe/post?u=...&id=...
// Set it as VITE_MAILCHIMP_URL in Vercel env vars. Mailchimp sends the
// confirmation email from its own servers, so no verified domain is needed.
const MAILCHIMP_URL = import.meta.env.VITE_MAILCHIMP_URL as string | undefined;

// Legacy fallback: any POST endpoint that accepts { email }.
const ENDPOINT = import.meta.env.VITE_WAITLIST_ENDPOINT as string | undefined;

// Mailchimp's signup endpoint has no CORS headers, so a fetch() would be
// blocked by the browser. Their sanctioned workaround is the JSONP variant
// of the same URL (subscribe/post-json + a callback param).
function subscribeMailchimp(actionUrl: string, email: string): Promise<{ result: string; msg: string }> {
  return new Promise((resolve, reject) => {
    const cbName = `__mcCallback${Date.now()}`;
    const script = document.createElement('script');
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('timeout'));
    }, 10000);
    const cleanup = () => {
      window.clearTimeout(timer);
      delete (window as unknown as Record<string, unknown>)[cbName];
      script.remove();
    };
    (window as unknown as Record<string, unknown>)[cbName] = (data: { result: string; msg: string }) => {
      cleanup();
      resolve(data);
    };
    script.onerror = () => {
      cleanup();
      reject(new Error('network'));
    };
    const base = actionUrl.replace('/subscribe/post?', '/subscribe/post-json?');
    script.src = `${base}&EMAIL=${encodeURIComponent(email)}&c=${cbName}`;
    document.body.appendChild(script);
  });
}

export function FinalCTA() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    setStatus('sending');

    if (MAILCHIMP_URL) {
      try {
        const data = await subscribeMailchimp(MAILCHIMP_URL, email);
        // "already subscribed" errors still mean they're on the list.
        const ok = data.result === 'success' || /already subscribed/i.test(data.msg);
        setStatus(ok ? 'done' : 'error');
      } catch {
        setStatus('error');
      }
      return;
    }

    if (ENDPOINT) {
      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        setStatus(res.ok ? 'done' : 'error');
        return;
      } catch {
        setStatus('error');
        return;
      }
    }

    setTimeout(() => setStatus('done'), 700);
  };

  return (
    <section id="download" className="relative py-32 md:py-44 overflow-hidden bg-ink/45">
      <div className="max-w-[900px] mx-auto px-6 md:px-10 text-center relative">
        <FadeUp>
          <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-accent">
            Coming to iOS
          </span>
        </FadeUp>

        <SplitReveal
          as="h2"
          by="word"
          className="font-display text-6xl md:text-8xl leading-[0.92] tracking-tight text-white uppercase mt-4"
        >
          Be first in the corner.
        </SplitReveal>

        <FadeUp delay={0.3}>
          <p className="mt-6 text-lg text-mute max-w-lg mx-auto leading-relaxed">
            Corner Coach is finishing final rounds of testing. Leave your email and we'll tell you the
            second it lands on the App Store — nothing else, ever.
          </p>
        </FadeUp>

        <FadeUp delay={0.45} className="mt-10">
          <AnimatePresence mode="wait">
            {status === 'done' ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <span className="inline-flex w-14 h-14 rounded-full bg-accent items-center justify-center">
                  <svg width="22" height="17" viewBox="0 0 22 17" fill="none">
                    <path d="M1 8.5L8 15.5L21 1.5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <p className="font-display text-2xl text-white">You're on the list.</p>
                <p className="text-sm text-mute">We'll email {email} the day we launch.</p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                exit={{ opacity: 0 }}
                onSubmit={onSubmit}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              >
                <input
                  type="email"
                  required
                  disabled={status === 'sending'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="flex-1 rounded-full bg-white/[0.04] border border-white/15 px-6 py-4 text-sm text-white placeholder:text-mute/60 outline-none focus:border-accent transition-colors disabled:opacity-60"
                />
                <MagneticButton type="submit" variant="solid" disabled={status === 'sending'} className="whitespace-nowrap">
                  {status === 'sending' ? 'Joining…' : 'Join the Waitlist'}
                </MagneticButton>
              </motion.form>
            )}
          </AnimatePresence>
          {status === 'error' ? (
            <p className="text-xs text-accent mt-3">Something went wrong — try again in a moment.</p>
          ) : null}
        </FadeUp>

        <FadeUp delay={0.6}>
          <p className="text-xs text-mute/50 mt-8">No spam. One email, when it's real.</p>
        </FadeUp>
      </div>
    </section>
  );
}
