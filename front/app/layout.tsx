import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Navigation } from '@/components/Navigation';
import { Toaster } from '@/components/ui/Toaster';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navigation />
            <main className="pt-16">
              {children}
            </main>
            <Toaster />
          </div>
        </Providers>
      </body>
    </html>
  );
}
