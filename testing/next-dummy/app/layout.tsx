import type { Metadata } from "next";
import "./globals.css";

// Local Mojo Guardian Implementation
class MojoGuardian {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.rules = {};
  }
  async init() {
    const res = await fetch('https://agenttestx-production-19d6.up.railway.app/api/agent/manifest', {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    const data = await res.json();
    this.rules = data.rules || {};
  }
  getMetadata(path) {
    return this.rules[path] || null;
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
