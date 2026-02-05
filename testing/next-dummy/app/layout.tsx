import type { Metadata } from "next";
import "./globals.css";

// Local Mojo Guardian Implementation
class MojoGuardian {
  apiKey: string;
  rules: any;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.rules = {};
  }
  async init() {
    try {
      const res = await fetch('https://agenttestx-production-19d6.up.railway.app/api/agent/manifest', {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        next: { revalidate: 60 } // Cache for 60 seconds
      });
      const data = await res.json();
      this.rules = data.rules || {};
    } catch (e) {
      this.rules = {};
    }
  }
  getMetadata(path: string) {
    return this.rules[path] || null;
  }
  getPageContent(path: string) {
    const rule = this.rules[path];
    if (rule && rule.type === 'INJECT_HTML') {
      return {
        html: rule.html,
        title: rule.title,
        description: rule.metaDesc || rule.metaDescription
      };
    }
    return null;
  }
}

const mojo = new MojoGuardian("mojo_0olio1pl57dg");

export async function generateMetadata(): Promise<Metadata> {
  await mojo.init();
  const optimized = mojo.getMetadata("/");

  return {
    title: optimized?.title || "Mojo Next.js Local Test",
    description: optimized?.description || "A high-performance Next.js site protected by Mojo Guardian.",
    icons: {
      icon: "https://agenttestx-production-19d6.up.railway.app/logo.svg",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
