/**
 * MOONFLIP PREMIUM VISUAL SYSTEM - IMPLEMENTATION GUIDE
 * The exact system used by 3k+ SOL/day private Solana gambling games
 * 
 * PREMIUM FEATURES IMPLEMENTED:
 * ✓ Full dark premium theme with glassmorphism cards
 * ✓ Subtle animated cosmic background gradient 
 * ✓ Neon color palette: #00ff9f, #ff0066, #8b00ff, #39ff14
 * ✓ Huge glowing GREEN and RED bet buttons with gradient fill
 * ✓ Massive circular 60-second countdown ring with thick pulsing neon stroke
 * ✓ Live price display with huge bold neon numbers
 * ✓ WIN CELEBRATION: full-screen neon confetti + raining gold SOL coins
 * ✓ Live counters with animated numbers
 * ✓ Premium typography: Inter + Space Grotesk + Orbitron
 * ✓ Trust badges with verification indicators
 * 
 * USAGE INSTRUCTIONS:
 * 1. Import premium components in your pages
 * 2. Use glass-card class for glassmorphism effects
 * 3. Apply neon-text-* classes for glowing text
 * 4. Use bet-button-green and bet-button-red for premium bet buttons
 * 5. Implement PremiumCountdownRing for the 60-second timer
 * 6. Add PremiumWinCelebration for win effects
 * 7. Use PremiumLiveCounters for trust indicators
 * 
 * EXAMPLE IMPLEMENTATION:
 */

// Import premium components
import { PremiumLayout } from './PremiumLayout';
import { PremiumBetButton, PremiumBetButtonPair } from './PremiumBetButtons';
import { PremiumCountdownRing } from './PremiumCountdownRing';
import { PremiumLivePriceDisplay } from './PremiumLivePriceDisplay';
import { PremiumWinCelebration } from './PremiumWinCelebration';
import { PremiumLiveCounters } from './PremiumLiveCounters';
import { TokenIcon } from './TokenIcon';

// Example usage in a component:
export function PremiumMoonFlipExample() {
  return (
    <PremiumLayout>
      <div className="min-h-screen pt-20">
        <div className="container mx-auto px-4">
          
          {/* Premium header */}
          <div className="text-center mb-12">
            <h1 className="text-6xl font-display text-white mb-4 neon-text-purple">
              MOONFLIP
            </h1>
            <p className="text-xl text-gray-300">
              60-Second Memecoin Challenge
            </p>
          </div>

          {/* Live counters - shows volume, flips, biggest win */}
          <PremiumLiveCounters />

          {/* Main game interface */}
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            
            {/* Left side - Coin info */}
            <div className="space-y-6">
              <div className="glass-card p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <TokenIcon mint="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" symbol="USDC" size={64} />
                  <div>
                    <h2 className="text-2xl font-display text-white">USDC</h2>
                    <p className="text-gray-400">USD Coin</p>
                  </div>
                </div>
                
                <PremiumLivePriceDisplay
                  price={1.00}
                  change24h={0.15}
                  symbol="USDC"
                  sparklineData={[0.99, 1.00, 1.01, 1.00, 1.02, 1.00]}
                  size="xl"
                />
              </div>
            </div>

            {/* Right side - Bet interface */}
            <div className="space-y-6">
              {/* Massive countdown timer */}
              <div className="glass-card p-6 text-center">
                <h3 className="text-lg font-display text-white mb-4">Time Remaining</h3>
                <div className="flex justify-center">
                  <PremiumCountdownRing duration={60000} size={180} strokeWidth={12} />
                </div>
              </div>

              {/* Huge glowing bet buttons */}
              <PremiumBetButtonPair 
                amount={1.0}
                onGreenClick={() => console.log('Bet UP')}
                onRedClick={() => console.log('Bet DOWN')}
                isLoading={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Win celebration overlay */}
      <PremiumWinCelebration
        isVisible={false}
        multiplier={1.9}
        payout={1.9}
        onComplete={() => console.log('Celebration complete')}
      />
    </PremiumLayout>
  );
}

// CSS CLASSES AVAILABLE:
// .glass-card - Glassmorphism card with backdrop blur
// .neon-text-lime - Glowing lime text
// .neon-text-pink - Glowing pink text  
// .neon-text-purple - Glowing purple text
// .bet-button-green - Massive green bet button with glow
// .bet-button-red - Massive red bet button with glow
// .countdown-ring - Pulsing neon countdown ring
// .font-display - Space Grotesk font for headers
// .font-mono-premium - JetBrains Mono for numbers
// .price-pump-animation - Animation for price increases
// .win-celebration - Win celebration animation

// PREMIUM COLOR PALETTE:
// #00ff9f - Electric lime green
// #ff0066 - Hot pink
// #8b00ff - Electric purple  
// #39ff14 - Brighter glow green
// #ff073a - Intense red
// #00d4ff - Cyber blue
// #ffff00 - Pure yellow
// #ff6b35 - Neon orange