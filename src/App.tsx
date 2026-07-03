import { lazy, Suspense } from 'react';
import { useLenis } from './lib/useLenis';
import { ScrollProgress } from './components/ScrollProgress';
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

export default function App() {
  useLenis();

  return (
    <>
      <Suspense fallback={null}>
        <SceneContainer />
      </Suspense>
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
