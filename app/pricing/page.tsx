import LandingNavbar from '@/components/LandingNavbar';
import Footer from '@/components/Footer';
import PricingTiers from '@/components/PricingTiers';

export const dynamic = 'force-dynamic';

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <LandingNavbar />
      
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 font-serif">
            Scalable SEO Protection <br />
            <span className="text-terminal">for every growth stage.</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Stop losing revenue to 404s and weak metadata. Choose a plan and let Mojo Guardian take over your infrastructure.
          </p>
        </div>

        <PricingTiers />
      </section>

      <Footer />
    </main>
  );
}
