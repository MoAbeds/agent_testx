import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MojoGuardian from "@moabeds/mojo-guardian";

const inter = Inter({ subsets: ["latin"] });

// Initialize Mojo Guardian
const mojo = new MojoGuardian("mojo_0olio1pl57dg");

export async function generateMetadata(): Promise<Metadata> {
  // Removed agent handshake during build to prevent failures
  return {
    title: "Mojo Next.js Dummy",
    description: "A high-performance Next.js site protected by Mojo Guardian.",
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
      <body className={inter.className}>{children}</body>
    </html>
  );
}
