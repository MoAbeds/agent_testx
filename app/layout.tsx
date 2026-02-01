import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mojo SaaS",
  description: "Automated SEO & Traffic Optimization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#0a0a0a] text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
