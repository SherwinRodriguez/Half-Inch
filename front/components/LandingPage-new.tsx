'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Shield, BarChart3, Coins, TrendingUp, Users, ExternalLink, ChevronRight, Layers, Activity } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
      {/* Hero Section */}
      <section className="relative px-4 pt-24 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-tan-nimbus font-bold text-white mb-8 leading-tight">
              One-stop access
              <span className="block text-4xl md:text-6xl font-bricolage text-blue-400 mt-2">
                to DeFi liquidity management
              </span>
            </h1>
            
            {/* CTA Buttons */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link 
                href="/" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 flex items-center gap-2 text-lg min-w-[200px] justify-center"
              >
                Launch dApp
              </Link>
              <div className="flex gap-3">
                <Link 
                  href="#" 
                  className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-xl transition-colors"
                >
                  📱
                </Link>
                <Link 
                  href="#" 
                  className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-xl transition-colors"
                >
                  🤖
                </Link>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">50+</div>
                <div className="text-gray-400 text-sm font-space-grotesk">Liquidity sources</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">$10M+</div>
                <div className="text-gray-400 text-sm font-space-grotesk">Total volume</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">5K+</div>
                <div className="text-gray-400 text-sm font-space-grotesk">Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">25K+</div>
                <div className="text-gray-400 text-sm font-space-grotesk">Rebalances</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Networks Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bricolage font-bold text-white mb-4">
              Optimize your pools across multiple networks
            </h2>
          </div>
          
          {/* Network Logos */}
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-70">
            {[
              { name: 'Rootstock', logo: '🔗' },
              { name: 'Ethereum', logo: '⟠' },
              { name: 'Polygon', logo: '◆' },
              { name: 'BSC', logo: '🔸' },
              { name: 'Arbitrum', logo: '🔵' },
              { name: 'Base', logo: '🔷' },
              { name: 'Optimism', logo: '🔴' },
              { name: 'Avalanche', logo: '❄️' },
            ].map((network, index) => (
              <div key={index} className="flex flex-col items-center p-4 hover:opacity-100 transition-opacity">
                <div className="text-3xl mb-2">{network.logo}</div>
                <div className="text-sm text-gray-400 font-space-grotesk">{network.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bricolage font-bold text-white mb-4">
              Hues products
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Pool Management Card */}
            <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:bg-slate-800/80 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-blue-600 rounded-xl mr-4">
                  <Layers className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bricolage font-semibold text-white">
                  Automated Pool Management
                </h3>
              </div>
              <p className="text-gray-400 mb-6 font-space-grotesk">
                Intelligent liquidity pool management with automated rebalancing and yield optimization.
              </p>
              <div className="flex items-center gap-4">
                <Link href="/" className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
                  Launch Pools <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="#" className="text-gray-400 hover:text-gray-300 text-sm">
                  Learn more
                </Link>
              </div>
            </div>

            {/* Analytics Card */}
            <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:bg-slate-800/80 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-purple-600 rounded-xl mr-4">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bricolage font-semibold text-white">
                  Advanced Analytics
                </h3>
              </div>
              <p className="text-gray-400 mb-6 font-space-grotesk">
                Comprehensive tracking and analytics for your DeFi portfolio performance.
              </p>
              <div className="flex items-center gap-4">
                <Link href="/analytics" className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
                  Launch Analytics <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="#" className="text-gray-400 hover:text-gray-300 text-sm">
                  Learn more
                </Link>
              </div>
            </div>

            {/* Rebalancing Card */}
            <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:bg-slate-800/80 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-green-600 rounded-xl mr-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bricolage font-semibold text-white">
                  Smart Rebalancing
                </h3>
              </div>
              <p className="text-gray-400 mb-6 font-space-grotesk">
                Automated rebalancing with MEV protection and optimal execution strategies.
              </p>
              <div className="flex items-center gap-4">
                <Link href="/rebalance" className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
                  Start Rebalancing <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="#" className="text-gray-400 hover:text-gray-300 text-sm">
                  Learn more
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bricolage font-bold text-white mb-6">
              Build your own DeFi solution
            </h2>
            <p className="text-xl text-gray-300 mb-8 font-space-grotesk">
              Integrate Hues APIs and smart contracts to build next-generation DeFi applications
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="#" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center gap-2"
              >
                Launch Dev Portal <ExternalLink className="w-4 h-4" />
              </Link>
              <Link 
                href="#" 
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bricolage font-bold text-white mb-6">
              Securing the future of DeFi
            </h2>
            <p className="text-xl text-gray-300 mb-8 font-space-grotesk">
              Hues is dedicated to advancing a secure and compliant DeFi ecosystem with cutting-edge security protocols and smart contract audits.
            </p>
            <Link 
              href="#" 
              className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium"
            >
              Learn More <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-slate-900">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bricolage font-bold text-white mb-8">
            Ready to optimize your DeFi experience?
          </h2>
          <Link 
            href="/" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors text-lg"
          >
            Launch Hues DEX
          </Link>
        </div>
      </section>
    </div>
  );
}