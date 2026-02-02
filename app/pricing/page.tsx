import LandingNavbar from '@/components/LandingNavbar';
import Footer from '@/components/Footer';
import { Check, Zap, Shield, Rocket } from 'lucide-react';
import Link from 'next/link';

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Starter Plan */}
          <PricingCard 
            tier="Starter"
            price="$49"
            description="Perfect for small business owners and niche blogs."
            features={['1 Website', '100 AI Optimizations / mo', 'Real-time 404 Guardian', 'Standard Email Support']}
            icon={Zap}
          />

          {/* Pro Plan */}
          <PricingCard 
            tier="Professional"
            price="$149"
            description="Our most popular plan for scaling SaaS and E-commerce."
            features={['5 Websites', '1,000 AI Optimizations / mo', 'Full Market Intelligence', 'Priority 404 Fixing', 'Premium Support']}
            isPopular={true}
            icon={Rocket}
          />

          {/* Enterprise Plan */}
          <PricingCard 
            tier="Enterprise"
            price="Custom"
            description="Deep SEO infrastructure for agencies and high-traffic networks."
            features={['Unlimited Websites', 'Unlimited Optimizations', 'White-label SDK', 'API Access', 'Dedicated SEO Architect']}
            icon={Shield}
          />
        </div>
      </section>

      <Footer />
    </main>
  );
}

function PricingCard({ tier, price, description, features, icon: Icon, isPopular = false }: any) {
  return (
    <div className={`relative p-8 rounded-2xl border transition-all hover:translate-y-[-4px] ${isPopular ? 'bg-gradient-to-b from-gray-900 to-black border-terminal shadow-2xl shadow-terminal/10' : 'bg-[#0d0d0d] border-gray-800'}`}>
      {isPopular && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-terminal text-black text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">
          Most Popular
        </span>
      )}
      
      <div className="mb-8">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${isPopular ? 'bg-terminal/20 text-terminal' : 'bg-gray-800 text-gray-400'}`}>
          <Icon size={24} />
        </div>
        <h3 className="text-xl font-bold mb-2">{tier}</h3>
        <div className="flex items-baseline gap-1 mb-4">
          <span className="text-4xl font-black">{price}</span>
          {price !== 'Custom' && <span className="text-gray-500 text-sm">/mo</span>}
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>

      <ul className="space-y-4 mb-8">
        {features.map((feature: string, i: number) => (
          <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
            <Check size={16} className="text-terminal shrink-0 mt-0.5" />
            {feature}
          </li>
        ))}
      </ul>

      <Link 
        href="/signup"
        className={`block w-full py-4 rounded-xl text-center font-bold transition-all ${isPopular ? 'bg-terminal text-black hover:bg-green-400' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}`}
      >
        Get Started
      </Link>
    </div>
  );
}
