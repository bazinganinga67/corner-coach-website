/**
 * Always-on CSS backdrop that sits *behind* the WebGL scene.
 *
 * The 3D canvas renders opaque on top of this, so when everything works
 * nobody ever sees it. But when the scene can't run — Reduce Motion enabled
 * (very common on iOS), no WebGL, GPU blacklist, context loss, or the lazy
 * chunk failing to download — the page still opens onto a lit gym instead
 * of a flat black void. Static by design: safe for prefers-reduced-motion.
 *
 * The gradient layers mirror the scene's lighting rig in SceneContainer:
 * warm key spotlight upper-right, red kicker lower-left, dark floor falloff.
 */
export function StaticBackdrop() {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
      style={{
        background: [
          // warm overhead spotlight (mirrors the #ffe3c4 key light)
          'radial-gradient(ellipse 75% 60% at 62% 14%, rgba(255,217,179,0.17) 0%, rgba(255,200,150,0.05) 45%, transparent 72%)',
          // red kicker glow (mirrors the #FF2E3E point light)
          'radial-gradient(ellipse 60% 50% at 10% 80%, rgba(255,46,62,0.20) 0%, rgba(179,15,31,0.06) 48%, transparent 72%)',
          // secondary red bloom mid-right, echoes the glove's rim light
          'radial-gradient(ellipse 40% 35% at 78% 48%, rgba(255,46,62,0.08) 0%, transparent 65%)',
          // faint cool rim from the right
          'radial-gradient(ellipse 45% 40% at 95% 55%, rgba(125,155,255,0.08) 0%, transparent 65%)',
          // floor falloff into darkness
          'linear-gradient(180deg, #050508 0%, transparent 30%, transparent 55%, rgba(8,8,12,0.85) 100%)',
          // base coat
          '#050508',
        ].join(', '),
      }}
    />
  );
}
