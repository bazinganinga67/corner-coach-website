import { Component, lazy, Suspense, type ReactNode } from 'react';
import { useLenis } from './lib/useLenis';
import { ScrollProgress } from './components/ScrollProgress';
import { StaticBackdrop } from './components/StaticBackdrop';
import { SectionIndicator } from './components/SectionIndicator';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Stats } from './components/Stats';
import { NumberShowcase } from './components/NumberShowcase';
import { HowItWorks } from './components/HowItWorks';
import { VoiceSection } from './components/VoiceSection';
import { Comparison } from './components/Comparison';
import { Pricing } from './components/Pricing';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';
const SceneContainer = lazy(() => import('./three/SceneContainer'));

/**
 * If the 3D scene throws (driver bugs, chunk load failure on flaky mobile
 * networks, WebGL edge cases), swallow it so the rest of the page survives —
 * the StaticBackdrop underneath keeps the visuals intact.
 */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function App() {
  useLenis();

  return (
    <>
      <StaticBackdrop />
      <SceneBoundary>
        <Suspense fallback={null}>
          <SceneContainer />
        </Suspense>
      </SceneBoundary>
      <ScrollProgress />
      <SectionIndicator />
      <div className="noise-layer" />
      <div className="vignette" />

      <Navbar />
      <main>
        <Hero revealed />
        <Stats />
        <NumberShowcase />
        <HowItWorks />
        <VoiceSection />
        <Comparison />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
