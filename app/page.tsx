import LandingNavbar from '@/components/LandingNavbar';
import Hero from '@/components/Hero';
import FeatureGrid from '@/components/FeatureGrid';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <LandingNavbar />
      <Hero />
      <FeatureGrid />
      <Footer />
    </main>
  );
}
