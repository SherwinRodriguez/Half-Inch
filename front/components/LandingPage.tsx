'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Shield, BarChart3, Coins, TrendingUp, Users } from 'lucide-react';
import CardSwap, { Card } from './CardSwap';

export function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      
      {/* Content Overlay */}
      <div className="relative z-10 min-h-screen">
        {/* Hero Section */}
        <section className="relative px-4 pt-20 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              {/* HalfInch Title */}
              <div className="mb-8">
                <h1 className="text-7xl sm:text-8xl lg:text-9xl font-tan-nimbus font-black text-white mb-6 tracking-tight leading-none">
                  <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
                    Half
                  </span>
                  <span className="text-white">
                    Inch
                  </span>
                </h1>
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="h-px bg-orange-400 w-20"></div>
                  <p className="text-orange-300 font-space-grotesk text-xl font-semibold tracking-wider uppercase">
                    The Blockchain Builder's Foundation
                  </p>
                  <div className="h-px bg-orange-400 w-20"></div>
                </div>
              </div>
              <p className="mt-6 text-xl leading-8 text-gray-200 max-w-3xl mx-auto font-space-grotesk">
                Next-generation decentralized exchange with automated liquidity pool management, 
                intelligent rebalancing, and advanced yield optimization strategies on Rootstock.
              </p>
              {/* Feature Tags */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-8 mb-10">
                <span className="bg-gradient-to-r from-cyan-500 to-cyan-400 text-black px-4 py-2 rounded-full text-sm font-medium">
                  LIQUIDITY
                </span>
                <span className="bg-gradient-to-r from-orange-500 to-orange-400 text-black px-4 py-2 rounded-full text-sm font-medium">
                  BITCOIN
                </span>
                <span className="bg-gradient-to-r from-purple-500 to-purple-400 text-white px-4 py-2 rounded-full text-sm font-medium">
                  ROOTSTOCK
                </span>
                <span className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-black px-4 py-2 rounded-full text-sm font-medium">
                  REBALANCING
                </span>
              </div>
              
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link href="/dashboard" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-3 px-8 rounded-lg transition-all duration-200 flex items-center gap-2 text-lg shadow-lg shadow-orange-500/25">
                  Launch App
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/analytics" className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-medium py-3 px-8 rounded-lg transition-all duration-200 border border-orange-400/50 text-lg">
                  View Analytics
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-4 py-24 sm:px-6 lg:px-8 relative">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left Column - Text Content */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl font-bricolage font-bold tracking-tight text-white sm:text-5xl mb-6">
                    Advanced DeFi Infrastructure
                  </h2>
                  <p className="text-lg text-gray-300 font-space-grotesk">
                    Built for the next generation of decentralized finance
                  </p>
                </div>
                
                {/* Feature List */}
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-500/20 rounded-lg flex-shrink-0">
                      <Zap className="w-5 h-5 text-blue-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Automated Rebalancing</h3>
                      <p className="text-gray-300 text-sm">Smart algorithms automatically rebalance your liquidity pools to maintain optimal ratios and maximize returns.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-500/20 rounded-lg flex-shrink-0">
                      <Shield className="w-5 h-5 text-green-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Security First</h3>
                      <p className="text-gray-300 text-sm">Audited smart contracts with multi-layer security protocols to protect your assets at all times.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-purple-500/20 rounded-lg flex-shrink-0">
                      <BarChart3 className="w-5 h-5 text-purple-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Advanced Analytics</h3>
                      <p className="text-gray-300 text-sm">Comprehensive analytics dashboard with real-time insights into pool performance and market trends.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-yellow-500/20 rounded-lg flex-shrink-0">
                      <Coins className="w-5 h-5 text-yellow-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Multi-Token Support</h3>
                      <p className="text-gray-300 text-sm">Support for a wide range of tokens with seamless cross-chain compatibility and low fees.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-red-500/20 rounded-lg flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-red-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Yield Optimization</h3>
                      <p className="text-gray-300 text-sm">Intelligent yield farming strategies to maximize returns while minimizing impermanent loss.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-indigo-500/20 rounded-lg flex-shrink-0">
                      <Users className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Community Driven</h3>
                      <p className="text-gray-300 text-sm">Decentralized governance allowing the community to shape the future of the platform.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - CardSwap Animation */}
              <div style={{ height: '600px', position: 'relative' }}>
                <CardSwap
                  cardDistance={60}
                  verticalDistance={70}
                  delay={4000}
                  pauseOnHover={false}
                  width={400}
                  height={300}
                >
                <Card>
                  <div className="flex items-center mb-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-lg mr-4">
                      <Zap className="w-6 h-6 text-blue-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      Automated Rebalancing
                    </h3>
                  </div>
                  <p className="text-gray-300">
                    Smart algorithms automatically rebalance your liquidity pools to maintain optimal ratios and maximize returns.
                  </p>
                </Card>
                <Card>
                  <div className="flex items-center mb-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-lg mr-4">
                      <Shield className="w-6 h-6 text-green-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      Security First
                    </h3>
                  </div>
                  <p className="text-gray-300">
                    Audited smart contracts with multi-layer security protocols to protect your assets at all times.
                  </p>
                </Card>
                <Card>
                  <div className="flex items-center mb-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-lg mr-4">
                      <BarChart3 className="w-6 h-6 text-purple-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      Advanced Analytics
                    </h3>
                  </div>
                  <p className="text-gray-300">
                    Comprehensive analytics dashboard with real-time insights into pool performance and market trends.
                  </p>
                </Card>
                <Card>
                  <div className="flex items-center mb-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-yellow-500/20 rounded-lg mr-4">
                      <Coins className="w-6 h-6 text-yellow-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      Multi-Token Support
                    </h3>
                  </div>
                  <p className="text-gray-300">
                    Support for a wide range of tokens with seamless cross-chain compatibility and low fees.
                  </p>
                </Card>
                <Card>
                  <div className="flex items-center mb-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-lg mr-4">
                      <TrendingUp className="w-6 h-6 text-red-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      Yield Optimization
                    </h3>
                  </div>
                  <p className="text-gray-300">
                    Intelligent yield farming strategies to maximize returns while minimizing impermanent loss.
                  </p>
                </Card>
                <Card>
                  <div className="flex items-center mb-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-indigo-500/20 rounded-lg mr-4">
                      <Users className="w-6 h-6 text-indigo-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      Community Driven
                    </h3>
                  </div>
                  <p className="text-gray-300">
                    Decentralized governance allowing the community to shape the future of the platform.
                  </p>
                </Card>
              </CardSwap>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">$50M+</div>
                  <div className="text-sm text-gray-300 mt-2">Total Value Locked</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">25K+</div>
                  <div className="text-sm text-gray-300 mt-2">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">150+</div>
                  <div className="text-sm text-gray-300 mt-2">Liquidity Pools</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">99.9%</div>
                  <div className="text-sm text-gray-300 mt-2">Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Ready to start earning?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Join thousands of users already earning with HalfInch. Start by creating your first liquidity pool or explore existing opportunities.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/create-pool" className="bg-white text-black hover:bg-gray-200 font-medium py-3 px-8 rounded-lg transition-all duration-200 flex items-center gap-2 text-lg">
                Create Pool
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/pools" className="bg-transparent hover:bg-white/10 text-white font-medium py-3 px-8 rounded-lg transition-all duration-200 border border-white/50 text-lg">
                Explore Pools
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}