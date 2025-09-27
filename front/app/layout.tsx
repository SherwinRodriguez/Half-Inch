import type { Metadata } from 'next';
import { Unbounded, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Navigation } from '@/components/Navigation';
import { Toaster } from '@/components/ui/Toaster';
import { PageTransition } from '@/components/PageTransition';
import PatternBackground from '@/components/PatternBackground';
import { SystemInitializer } from '@/components/SystemInitializer';

// Primary fonts
const unbounded = Unbounded({ 
  subsets: ['latin'], 
  variable: '--font-unbounded',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'], 
  variable: '--font-space-grotesk',
  display: 'swap',
});

// Note: Bricolage Grotesque and TAN NIMBUS are not available on Google Fonts
// We'll need to add them via external links or self-hosted fonts

export const metadata: Metadata = {
  title: 'Hues DEX - Liquidity Rebalancing Platform',
  description: 'Advanced DEX liquidity pool management and automated rebalancing for Rootstock network',
  keywords: ['DEX', 'DeFi', 'Liquidity', 'Rebalancing', 'Rootstock', 'RSK'],
  authors: [{ name: 'Hues Team' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Add external font links for fonts not available on Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap"
          rel="stylesheet"
        />
        {/* TAN NIMBUS font will be loaded via CSS */}
      </head>
      <body className={`${unbounded.variable} ${spaceGrotesk.variable} font-space-grotesk antialiased`}>
        <Providers>
          <SystemInitializer>
            <div className="min-h-screen relative">
              <PatternBackground />
              <div className="relative z-20">
                <Navigation />
                <main className="pt-16">
                  <PageTransition>
                    {children}
                  </PageTransition>
                </main>
              </div>
              <Toaster />
            </div>
          </SystemInitializer>
        </Providers>
      </body>
    </html>
  );
}
