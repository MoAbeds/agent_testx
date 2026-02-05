import LandingNavbar from '@/components/LandingNavbar';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <LandingNavbar />
      
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 font-serif">Terms of Service</h1>
          <div className="prose prose-invert prose-terminal max-w-none text-gray-400 space-y-6">
            <p className="text-sm italic">Last updated: February 5, 2026</p>
            
            <h2 className="text-xl font-bold text-white mt-8">1. Acceptance of Terms</h2>
            <p>
              By accessing Mojo Guardian, you agree to be bound by these Terms of Service and all applicable laws and regulations.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">2. Use License</h2>
            <p>
              Permission is granted to use Mojo Guardian's SEO infrastructure for your personal or commercial websites. You may not:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Modify or copy the core Mojo Agent SDK source code without authorization.</li>
              <li>Use the service for any illegal activities or black-hat SEO practices.</li>
              <li>Attempt to reverse engineer any software contained within the platform.</li>
            </ul>

            <h2 className="text-xl font-bold text-white mt-8">3. Subscriptions & Payments</h2>
            <p>
              Some features require a paid subscription. All payments are processed securely via PayPal. Subscriptions can be cancelled at any time through your dashboard settings.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">4. Disclaimer</h2>
            <p>
              Mojo Guardian provides autonomous SEO recommendations and fixes. While we strive for Page 1 results, we do not guarantee specific Google rankings as search algorithms are beyond our direct control.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">5. Limitations of Liability</h2>
            <p>
              Mojo Guardian shall not be held liable for any damages arising out of the use or inability to use the services, even if notified of the possibility of such damage.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">6. Governing Law</h2>
            <p>
              These terms are governed by and construed in accordance with the laws of the jurisdiction in which Mo Abeds operates.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
