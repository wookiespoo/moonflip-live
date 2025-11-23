'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PremiumBetSectionProps {
  amount: string;
  onAmountChange: (value: string) => void;
  onDirectionSelect: (direction: 'up' | 'down') => void;
  maxAmount: number;
  disabled?: boolean;
}

const PRESET_AMOUNTS = [0.5, 1, 5, 10, 25, 50];

export default function PremiumBetSection({ 
  amount, 
  onAmountChange, 
  onDirectionSelect, 
  maxAmount,
  disabled = false 
}: PremiumBetSectionProps) {
  const [focused, setFocused] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<'up' | 'down' | null>(null);

  const handlePresetClick = (preset: number) => {
    onAmountChange(preset.toString());
  };

  const handleAllIn = () => {
    onAmountChange(maxAmount.toFixed(2));
  };

  const handleDirectionClick = (direction: 'up' | 'down') => {
    if (!disabled) {
      onDirectionSelect(direction);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-12">
      {/* Header - BIGGER */}
      <div className="text-center space-y-4">
        <h2 className="font-space-grotesk font-black text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          Choose Your Side
        </h2>
        <p className="text-white/70 text-lg md:text-xl font-inter font-medium">
          Bet on the next 60-second candle
        </p>
      </div>

      {/* Bet Amount Input - MASSIVE & PREMIUM */}
      <motion.div 
        className={`relative bg-black/40 backdrop-blur-lg border rounded-3xl p-12 transition-all duration-500 ${
          focused 
            ? 'border-white/40 shadow-2xl shadow-purple-500/35 animate-neon-pulse' 
            : 'border-white/15 hover:border-white/30'
        }`}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="text-center space-y-8">
          {/* Input Field - MASSIVE */}
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              disabled={disabled}
              className="w-full bg-transparent text-center font-space-grotesk font-black text-7xl md:text-8xl text-white placeholder-white/40 border-none outline-none focus:outline-none focus:ring-0"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
            
            {/* SOL Symbol - BIGGER */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <span className="font-space-grotesk font-black text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 drop-shadow-2xl shadow-green-400/60">
                SOL
              </span>
            </div>
          </div>

          {/* Preset Buttons - MASSIVE & PREMIUM */}
          <div className="grid grid-cols-4 gap-3">
            {PRESET_AMOUNTS.map((preset) => (
              <motion.button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                disabled={disabled}
                className="relative overflow-hidden bg-gradient-to-br from-purple-500/40 via-purple-600/50 to-pink-600/40 border-2 border-white/20 rounded-2xl p-4 font-space-grotesk font-black text-xl text-white/90 hover:text-white hover:from-purple-500/60 hover:via-purple-600/70 hover:to-pink-600/60 hover:border-white/40 hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-pink-400/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="text-2xl font-black">{preset}</div>
                  <div className="text-xs font-semibold text-white/60">SOL</div>
                </div>
              </motion.button>
            ))}
            
            <motion.button
              onClick={handleAllIn}
              disabled={disabled}
              className="relative overflow-hidden bg-gradient-to-br from-red-500/50 via-orange-500/50 to-yellow-500/40 border-2 border-white/20 rounded-2xl p-4 font-space-grotesk font-black text-xl text-white hover:text-white hover:from-red-500/70 hover:via-orange-500/70 hover:to-yellow-500/60 hover:border-white/40 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-400/10 to-orange-400/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="text-lg font-black">ALL IN</div>
                <div className="text-xs font-semibold text-white/60">MAX</div>
              </div>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Direction Buttons - EVEN MORE MASSIVE */}
      <div className="space-y-8">
        {/* UP Button */}
        <motion.button
          onClick={() => handleDirectionClick('up')}
          disabled={disabled}
          onMouseEnter={() => setHoveredButton('up')}
          onMouseLeave={() => setHoveredButton(null)}
          className={`w-full relative overflow-hidden rounded-3xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
            hoveredButton === 'up' 
              ? 'shadow-2xl shadow-green-500/60 scale-105' 
              : 'shadow-xl shadow-green-500/40'
          }`}
          style={{
            background: 'linear-gradient(135deg, #00ff9f, #39ff14)',
            minHeight: '160px',
            filter: hoveredButton === 'up' ? 'brightness(1.3)' : 'none'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Glow Effect */}
          <div className={`absolute inset-0 transition-opacity duration-300 ${
            hoveredButton === 'up' ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="absolute inset-0 bg-gradient-to-r from-green-400/30 to-emerald-400/30 animate-pulse" />
          </div>
          
          {/* Arrow - MASSIVE */}
          <div className="relative z-10">
            <div className="text-white text-9xl md:text-10xl font-black drop-shadow-2xl mb-4">
              ↑
            </div>
            <div className="text-white/95 text-2xl md:text-3xl font-space-grotesk font-black">
              PRICE GOES UP
            </div>
          </div>
          
          {/* Neon Border - THICKER */}
          <div className={`absolute inset-0 rounded-3xl border-3 transition-all duration-300 ${
            hoveredButton === 'up' 
              ? 'border-white/70 shadow-inner shadow-white/30' 
              : 'border-white/40'
          }`} />
        </motion.button>

        {/* DOWN Button */}
        <motion.button
          onClick={() => handleDirectionClick('down')}
          disabled={disabled}
          onMouseEnter={() => setHoveredButton('down')}
          onMouseLeave={() => setHoveredButton(null)}
          className={`w-full relative overflow-hidden rounded-3xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
            hoveredButton === 'down' 
              ? 'shadow-2xl shadow-red-500/60 scale-105' 
              : 'shadow-xl shadow-red-500/40'
          }`}
          style={{
            background: 'linear-gradient(135deg, #ff0066, #ff00c8)',
            minHeight: '160px',
            filter: hoveredButton === 'down' ? 'brightness(1.3)' : 'none'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Glow Effect */}
          <div className={`absolute inset-0 transition-opacity duration-300 ${
            hoveredButton === 'down' ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="absolute inset-0 bg-gradient-to-r from-red-400/30 to-pink-400/30 animate-pulse" />
          </div>
          
          {/* Arrow - MASSIVE */}
          <div className="relative z-10">
            <div className="text-white text-9xl md:text-10xl font-black drop-shadow-2xl mb-4">
              ↓
            </div>
            <div className="text-white/95 text-2xl md:text-3xl font-space-grotesk font-black">
              PRICE GOES DOWN
            </div>
          </div>
          
          {/* Neon Border - THICKER */}
          <div className={`absolute inset-0 rounded-3xl border-3 transition-all duration-300 ${
            hoveredButton === 'down' 
              ? 'border-white/70 shadow-inner shadow-white/30' 
              : 'border-white/40'
          }`} />
        </motion.button>
      </div>

      {/* Trust Badge - MORE PROMINENT */}
      <div className="flex items-center justify-center space-x-3 text-white/70 text-base md:text-lg font-inter font-semibold">
        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">Powered by Jupiter API</span>
        <span className="text-white/40">•</span>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">10k+ flips today</span>
      </div>
    </div>
  );
}