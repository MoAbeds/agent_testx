import LandingNavbar from '@/components/LandingNavbar';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <LandingNavbar />
      
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 font-serif">Privacy Policy</h1>
          <div className="prose prose-invert prose-terminal max-w-none text-gray-400 space-y-6">
            <p className="text-sm italic">Last updated: February 5, 2026</p>
            
            <h2 className="text-xl font-bold text-white mt-8">1. Introduction</h2>
            <p>
              Mojo Guardian ("we," "our," or "us") respects your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our autonomous SEO infrastructure.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">2. Data We Collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, and authentication credentials via Firebase.</li>
              <li><strong>Website Data:</strong> Domains, sitemaps, and SEO metadata specifically for optimization purposes.</li>
              <li><strong>Usage Metrics:</strong> Log data regarding AI optimizations, 404 detections, and agent handshakes.</li>
            </ul>

            <h2 className="text-xl font-bold text-white mt-8">3. How We Use Your Data</h2>
            <p>
              We use the collected data to provide autonomous SEO services, including metadata injection, link fixing, and ranking analysis. We do not sell your personal or website data to third parties.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">4. Data Security</h2>
            <p>
              We implement industry-standard encryption and Firebase-backed security protocols to protect your data. However, no method of transmission over the internet is 100% secure.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">5. Cookies</h2>
            <p>
              We use functional cookies to maintain your session and preferences. You can disable these in your browser settings, though some features may become unavailable.
            </p>

            <h2 className="text-xl font-bold text-white mt-8">6. Contact</h2>
            <p>
              For privacy-related inquiries, please contact us at support@moabeds.com.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
