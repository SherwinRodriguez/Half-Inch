'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
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
  Zap,
  ArrowLeftRight,
  Coins
} from 'lucide-react';
import { WalletConnect } from './WalletConnect';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Trade', href: '/trade', icon: ArrowLeftRight },
    { name: 'Tokens', href: '/tokens', icon: Coins },
    { name: 'Pools', href: '/pools', icon: Layers },
    { name: 'Create Pool', href: '/create-pool', icon: Plus },
    { name: 'Rebalancing', href: '/rebalance', icon: Zap },
    { name: 'Analytics', href: '/analytics', icon: Activity },
  ];

  return (
    <motion.nav 
      initial={{ opacity: 0, y: -100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        delay: 0.1
      }}
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
            <Link href="/" className="flex items-center space-x-2">
              <motion.div 
                className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <span className="text-white font-bold text-sm">H</span>
              </motion.div>
              <motion.span 
                className="text-xl font-unbounded font-bold text-white"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                HalfInch
              </motion.span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item, index) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium relative overflow-hidden ${
                      isActive
                        ? 'bg-white/20 text-white backdrop-blur-sm'
                        : 'text-white hover:text-gray-300 hover:bg-white/10 backdrop-blur-sm'
                    }`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Icon className="w-4 h-4" />
                    </motion.div>
                    <span>{item.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-white/20 rounded-lg -z-10"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">
            {/* Wallet Connect */}
            <div className="hidden md:block">
              <WalletConnect compact={true} showBalance={false} showNetworkSwitch={false} />
            </div>

            {/* Theme Toggle */}
            <motion.button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg bg-white/10 text-white hover:text-gray-300 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
              aria-label="Toggle theme"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <AnimatePresence mode="wait">
                {theme === 'dark' ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Settings */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Link
                href="/settings"
                className="p-2 rounded-lg bg-white/10 text-white hover:text-gray-300 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm block"
              >
                <Settings className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Mobile menu button */}
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg bg-white/10 text-white hover:text-gray-300 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.div
                    key="x"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              opacity: { duration: 0.2 }
            }}
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
              <motion.div 
                className="px-3 py-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <WalletConnect compact={true} showBalance={true} showNetworkSwitch={false} />
              </motion.div>
              
              {navigation.map((item, index) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium transition-all duration-300 ${
                        isActive
                          ? 'bg-white/20 text-white backdrop-blur-sm'
                          : 'text-white hover:text-gray-300 hover:bg-white/10 backdrop-blur-sm'
                      }`}
                    >
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <Icon className="w-5 h-5" />
                      </motion.div>
                      <span>{item.name}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
