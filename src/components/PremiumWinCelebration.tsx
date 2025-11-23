import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface PremiumWinCelebrationProps {
  isVisible: boolean;
  multiplier: number;
  payout: number;
  onComplete?: () => void;
}

export function PremiumWinCelebration({ isVisible, multiplier, payout, onComplete }: PremiumWinCelebrationProps) {
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);
  const [showMultiplier, setShowMultiplier] = useState(false);
  const [showCoins, setShowCoins] = useState(false);
  const [coins, setCoins] = useState<Array<{ id: number; x: number; delay: number; size: number }>>([]);
  
  useEffect(() => {
    if (isVisible) {
      // Stagger the animations for maximum impact
      setTimeout(() => setShowConfetti(true), 0);
      setTimeout(() => setShowMultiplier(true), 200);
      setTimeout(() => {
        setShowCoins(true);
        generateCoins();
      }, 400);
      
      // Auto-hide after celebration
      const timer = setTimeout(() => {
        setShowConfetti(false);
        setShowMultiplier(false);
        setShowCoins(false);
        onComplete?.();
      }, 4000);
      
      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
      setShowMultiplier(false);
      setShowCoins(false);
    }
  }, [isVisible, onComplete]);
  
  const generateCoins = () => {
    const newCoins = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2000,
      size: Math.random() * 15 + 20
    }));
    setCoins(newCoins);
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Full-screen confetti */}
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={800}
          confettiSource={{
            x: width / 2,
            y: height,
            w: 0,
            h: 0
          }}
          initialVelocityX={{ min: -15, max: 15 }}
          initialVelocityY={{ min: -20, max: -5 }}
          gravity={0.3}
          colors={[
            '#00ff9f', '#ff0066', '#8b00ff', '#39ff14', 
            '#ff073a', '#00d4ff', '#ffff00', '#ffd700'
          ]}
        />
      )}
      
      {/* Multiplier explosion */}
      {showMultiplier && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            {/* Main multiplier */}
            <div className="win-multiplier animate-win-celebration">
              {multiplier.toFixed(2)}×
            </div>
            
            {/* Payout amount */}
            <div className="text-4xl font-black text-white animate-win-celebration" 
              style={{ animationDelay: '0.2s' }}>
              +{payout.toFixed(4)} SOL
            </div>
            
            {/* Win text */}
            <div className="text-2xl font-bold text-neon-lime animate-win-celebration"
              style={{ animationDelay: '0.4s' }}>
              🎉 MEGA WIN! 🎉
            </div>
          </div>
        </div>
      )}
      
      {/* Falling gold coins */}
      {showCoins && (
        <div className="absolute inset-0">
          {coins.map((coin) => (
            <div
              key={coin.id}
              className="gold-coin"
              style={{
                left: `${coin.x}%`,
                width: `${coin.size}px`,
                height: `${coin.size}px`,
                animationDelay: `${coin.delay}ms`,
                animationDuration: `${2 + Math.random()}s`
              }}
            >
              {/* Coin face */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500" />
              <div className="absolute inset-1 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600" />
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-400 flex items-center justify-center">
                <span className="text-xs font-black text-yellow-800">SOL</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
    </div>
  );
}

interface PremiumMiniCelebrationProps {
  isVisible: boolean;
  type: 'win' | 'loss';
  amount: number;
}

export function PremiumMiniCelebration({ isVisible, type, amount }: PremiumMiniCelebrationProps) {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);
  
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
      <div className={`
        text-center space-y-2 p-6 rounded-2xl
        ${type === 'win' 
          ? 'bg-gradient-to-r from-neon-lime/20 to-neon-green/20 border border-neon-lime/30'
          : 'bg-gradient-to-r from-neon-red/20 to-neon-pink/20 border border-neon-red/30'
        }
        backdrop-blur-sm animate-premium-bounce
      `}>
        <div className={`
          text-4xl font-black
          ${type === 'win' ? 'text-neon-lime' : 'text-neon-red'}
        `}>
          {type === 'win' ? '+' : '-'}{amount.toFixed(4)} SOL
        </div>
        <div className={`
          text-lg font-bold
          ${type === 'win' ? 'text-neon-lime' : 'text-neon-red'}
        `}>
          {type === 'win' ? '🎉 WIN!' : '😔 LOSS'}
        </div>
      </div>
    </div>
  );
}

interface PremiumSoundEffectsProps {
  playWin: boolean;
  playLoss: boolean;
}

export function PremiumSoundEffects({ playWin, playLoss }: PremiumSoundEffectsProps) {
  useEffect(() => {
    if (playWin) {
      // Create win sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioContext.currentTime + 0.3); // C6
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
    
    if (playLoss) {
      // Create loss sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
      oscillator.frequency.exponentialRampToValueAtTime(220, audioContext.currentTime + 0.4); // A3
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    }
  }, [playWin, playLoss]);
  
  return null;
}