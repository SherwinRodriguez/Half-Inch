'use client';

import { useEffect, useState } from 'react';

interface CircleElement {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
  animationDelay: number;
  speed: number;
}

export function PatternBackground() {
  const [circles, setCircles] = useState<CircleElement[]>([]);

  useEffect(() => {
    const generateCircles = () => {
      const newCircles: CircleElement[] = [];
      const colors = [
        'rgba(251, 146, 60, 0.05)', // Orange
        'rgba(249, 115, 22, 0.04)', // Bright orange
        'rgba(234, 88, 12, 0.06)', // Deep orange
        'rgba(194, 65, 12, 0.03)', // Dark orange
        'rgba(154, 52, 18, 0.02)', // Very dark orange
      ];

      // Generate random circles
      for (let i = 0; i < 30; i++) {
        newCircles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 200 + 50,
          opacity: Math.random() * 0.4 + 0.1,
          color: colors[Math.floor(Math.random() * colors.length)],
          animationDelay: Math.random() * 10,
          speed: Math.random() * 20 + 10,
        });
      }

      setCircles(newCircles);
    };

    generateCircles();
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-black" />
      
      {/* Geometric pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1000 1000"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              id="geometric-circles"
              patternUnits="userSpaceOnUse"
              width="200"
              height="200"
            >
              {/* Concentric circles */}
              <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(251, 146, 60, 0.03)" strokeWidth="1" />
              <circle cx="100" cy="100" r="40" fill="none" stroke="rgba(249, 115, 22, 0.02)" strokeWidth="1" />
              <circle cx="100" cy="100" r="20" fill="rgba(234, 88, 12, 0.01)" />
              
              {/* Additional geometric elements */}
              <circle cx="50" cy="50" r="15" fill="none" stroke="rgba(194, 65, 12, 0.02)" strokeWidth="1" />
              <circle cx="150" cy="150" r="25" fill="none" stroke="rgba(251, 146, 60, 0.02)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#geometric-circles)" />
        </svg>
      </div>

      {/* Animated circles */}
      {circles.map((circle) => (
        <div
          key={circle.id}
          className="absolute rounded-full animate-pulse-slow"
          style={{
            left: `${circle.x}%`,
            top: `${circle.y}%`,
            width: `${circle.size}px`,
            height: `${circle.size}px`,
            backgroundColor: circle.color,
            opacity: circle.opacity,
            animationDelay: `${circle.animationDelay}s`,
            animationDuration: `${circle.speed}s`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Large background circles */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-orange-500 rounded-full opacity-1 animate-pulse-slow" />
      <div className="absolute top-1/2 right-20 w-64 h-64 bg-amber-500 rounded-full opacity-1 animate-bounce-slow" />
      <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-orange-600 rounded-full opacity-1 animate-pulse-slow" />
      
      {/* Additional geometric shapes */}
      <div className="absolute top-1/3 left-1/2 w-48 h-48 border border-orange-400 rounded-full opacity-2 animate-spin-slow" />
      <div className="absolute bottom-1/3 right-1/3 w-32 h-32 border border-amber-400 rounded-full opacity-2 animate-pulse-slow" />
      <div className="absolute top-2/3 left-1/4 w-24 h-24 bg-orange-400 rounded-full opacity-1 animate-bounce-slow" />
      
      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-black/60" />
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/80" />
      <div className="absolute inset-0 bg-gradient-to-tl from-black/60 via-transparent to-black/40" />
      
      {/* Central glow effect */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-600 rounded-full opacity-2 blur-3xl animate-pulse-slow" />
    </div>
  );
}

export default PatternBackground;