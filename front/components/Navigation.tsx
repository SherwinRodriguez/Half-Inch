'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { 
  BarChart3, 
  Plus, 
  Settings, 
  Moon, 
  Sun, 
  Menu, 
  X,
  Activity,
  Layers,
  Zap
} from 'lucide-react';
import { WalletConnect } from './WalletConnect';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Pools', href: '/pools', icon: Layers },
    { name: 'Create Pool', href: '/create-pool', icon: Plus },
    { name: 'Rebalancing', href: '/rebalance', icon: Zap },
    { name: 'Analytics', href: '/analytics', icon: Activity },
  ];

  return (
    <nav 
      className="fixed top-4 left-4 right-4 md:left-6 md:right-6 z-50 rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(21px)',
        WebkitBackdropFilter: 'blur(21px)',
        border: '1px solid rgba(251, 146, 60, 0.3)',
        boxShadow: `
          0 8px 32px rgba(251, 146, 60, 0.1),
          inset 0 1px 0 rgba(251, 146, 60, 0.2),
          inset 0 -1px 0 rgba(249, 115, 22, 0.1),
          0 0 20px rgba(251, 146, 60, 0.05)
        `
      }}
    >
      {/* Top gradient highlight */}
      <div 
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(251, 146, 60, 0.6), transparent)'
        }}
      />
      {/* Left gradient highlight */}
      <div 
        className="absolute top-0 left-0 w-px h-full"
        style={{
          background: 'linear-gradient(180deg, rgba(251, 146, 60, 0.6), transparent, rgba(249, 115, 22, 0.3))'
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/landing" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="text-xl font-unbounded font-bold text-white">HalfInch</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-white/20 text-white backdrop-blur-sm'
                      : 'text-white hover:text-gray-300 hover:bg-white/10 backdrop-blur-sm'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">
            {/* Wallet Connect */}
            <div className="hidden md:block">
              <WalletConnect compact={true} showBalance={false} showNetworkSwitch={false} />
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg bg-white/10 text-white hover:text-gray-300 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Settings */}
            <Link
              href="/settings"
              className="p-2 rounded-lg bg-white/10 text-white hover:text-gray-300 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
            >
              <Settings className="w-4 h-4" />
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg bg-white/10 text-white hover:text-gray-300 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
            >
              {isOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div 
          className="md:hidden rounded-b-2xl mt-1 relative overflow-hidden"
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(21px)',
            WebkitBackdropFilter: 'blur(21px)',
            border: '1px solid rgba(251, 146, 60, 0.3)',
            borderTop: 'none',
            boxShadow: `
              0 8px 32px rgba(251, 146, 60, 0.1),
              inset 0 1px 0 rgba(251, 146, 60, 0.2),
              inset 0 -1px 0 rgba(249, 115, 22, 0.1)
            `
          }}
        >
          {/* Left gradient highlight for mobile */}
          <div 
            className="absolute top-0 left-0 w-px h-full"
            style={{
              background: 'linear-gradient(180deg, rgba(251, 146, 60, 0.6), transparent, rgba(249, 115, 22, 0.3))'
            }}
          />
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Mobile Wallet Connect */}
            <div className="px-3 py-2">
              <WalletConnect compact={true} showBalance={true} showNetworkSwitch={false} />
            </div>
            
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-white/20 text-white backdrop-blur-sm'
                      : 'text-white hover:text-gray-300 hover:bg-white/10 backdrop-blur-sm'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
