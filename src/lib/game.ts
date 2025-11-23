import { FlipBet, GameResult, PriceData, UserStats, LeaderboardEntry } from './types';
import { CONFIG } from './config';
import { jupiterService } from './jupiter';
import { database } from './database';
import { captureBet, captureError } from './monitoring';
import { houseBankrollManager } from './houseBankroll';

export class GameManager {
  private activeBets = new Map<string, FlipBet>();
  private betHistory = new Map<string, FlipBet[]>();
  private userBets = new Map<string, string[]>(); // wallet -> betIds
  private resolvingBets = new Set<string>(); // Track bets currently being resolved

  async createBet(
    userWallet: string,
    coinAddress: string,
    coinSymbol: string,
    amount: number,
    direction: 'GREEN' | 'RED',
    referral?: string
  ): Promise<FlipBet> {
    try {
      // Check bankroll status first
      const bankrollStatus = houseBankrollManager.getBettingStatus();
      if (bankrollStatus.paused) {
        throw new Error(bankrollStatus.reason || 'Betting is temporarily paused');
      }

      // Validate bet amount
      if (amount < CONFIG.MIN_BET || amount > CONFIG.MAX_BET) {
        throw new Error(`Bet amount must be between ${CONFIG.MIN_BET} and ${CONFIG.MAX_BET} SOL`);
      }

      // Check rate limits
      await this.checkRateLimits(userWallet);

      // Get current price
      const priceData = await jupiterService.getTokenPrice(coinAddress);

    // Create bet
    const bet: FlipBet = {
      id: this.generateBetId(),
      userWallet,
      coinAddress,
      coinSymbol,
      amount,
      direction,
      startPrice: priceData.price,
      startTime: Date.now(),
      status: 'PENDING',
      referral,
    };

    // Add bet amount to house bankroll
    houseBankrollManager.addToBankroll(amount, bet.id, userWallet);
    console.log(`💰 Bet placed: ${amount} SOL added to house bankroll → ${houseBankrollManager.getBankrollBalance()} SOL`);

    // Store in database
    await database.createBet({
      ...bet,
      status: 'PENDING' as const
    });
    
    // Capture bet creation for monitoring
    captureBet(bet);
    
    // Store in memory for quick access
    this.activeBets.set(bet.id, bet);
    
    // Track user bets
    const userBetIds = this.userBets.get(userWallet) || [];
    userBetIds.push(bet.id);
    this.userBets.set(userWallet, userBetIds);

    // Schedule bet resolution
    this.scheduleBetResolution(bet);

    return bet;
    } catch (error) {
      captureError(error as Error, {
        method: 'createBet',
        userWallet,
        coinAddress,
        coinSymbol,
        amount,
        direction,
        referral,
      });
      throw error;
    }
  }

  private scheduleBetResolution(bet: FlipBet): void {
    const resolveTime = bet.startTime + CONFIG.GAME_DURATION;
    const delay = resolveTime - Date.now();

    // Ensure we don't schedule resolution in the past
    const safeDelay = Math.max(1000, delay); // Minimum 1 second delay

    console.log(`Scheduling bet resolution for ${bet.id} in ${safeDelay}ms`);

    setTimeout(async () => {
      try {
        // Check if bet is still active before resolving
        if (!this.activeBets.has(bet.id)) {
          console.log(`Bet ${bet.id} is no longer active, skipping auto-resolution`);
          return;
        }
        
        console.log(`Auto-resolving bet: ${bet.id}`);
        await this.resolveBet(bet.id);
      } catch (error) {
        console.error(`Failed to resolve bet ${bet.id}:`, error);
        
        // If bet not found, it might have been manually resolved
        if (error instanceof Error && error.message.includes('not found')) {
          console.log(`Bet ${bet.id} was likely already resolved`);
        }
      }
    }, safeDelay);
  }

  async resolveBet(betId: string): Promise<GameResult> {
    try {
      // Check if bet is already being resolved
      if (this.resolvingBets.has(betId)) {
        console.log(`Bet ${betId} is already being resolved, skipping duplicate`);
        throw new Error(`Bet ${betId} is already being resolved`);
      }
      
      console.log(`Attempting to resolve bet: ${betId}`);
      console.log(`Active bets: ${Array.from(this.activeBets.keys()).join(', ')}`);
      
      const bet = this.activeBets.get(betId);
      if (!bet) {
        console.warn(`Bet ${betId} not found in active bets. Checking history...`);
        
        // Check if bet exists in history (already resolved)
        const historicalBet = this.getHistoricalBet(betId);
        if (historicalBet) {
          console.log(`Bet ${betId} found in history, already resolved`);
          throw new Error(`Bet ${betId} has already been resolved`);
        }
        
        console.error(`Bet ${betId} not found in active bets or history`);
        throw new Error(`Bet ${betId} not found`);
      }

      // Mark bet as being resolved
      this.resolvingBets.add(betId);

    // Get final price
    const endPriceData = await jupiterService.getTokenPrice(bet.coinAddress);
    bet.endPrice = endPriceData.price;
    bet.endTime = Date.now();

    // Determine winner
    const priceChange = ((bet.endPrice - bet.startPrice) / bet.startPrice) * 100;
    const won = (bet.direction === 'GREEN' && priceChange > 0) || 
                (bet.direction === 'RED' && priceChange < 0);

    bet.status = won ? 'WON' : 'LOST';

    // Calculate payouts using house bankroll
    let payoutAmount = 0;
    let feeAmount = 0;
    let referralAmount = 0;
    let netPayout = 0;

    if (won) {
      payoutAmount = bet.amount * CONFIG.PAYOUT_MULTIPLIER;
      
      // Process payout from house bankroll
      const payoutResult = houseBankrollManager.processWinPayout(
        bet.id,
        bet.userWallet,
        bet.amount,
        payoutAmount
      );

      if (!payoutResult.success) {
        console.error(`❌ Failed to process win payout: ${payoutResult.error}`);
        throw new Error(`Insufficient house bankroll for payout: ${payoutResult.error}`);
      }

      feeAmount = payoutResult.ownerFee;
      referralAmount = payoutResult.referralFee;
      netPayout = payoutResult.netPayout;

      console.log(`💰 Win processed: ${bet.amount} SOL → ${netPayout} SOL payout (fees: owner ${feeAmount}, referral ${referralAmount})`);
    }

    const result: GameResult = {
      bet,
      won,
      profit: won ? netPayout - bet.amount : -bet.amount,
      payoutAmount: netPayout,
      feeAmount,
      referralAmount: bet.referral ? referralAmount : undefined,
    };

    // Update database
    await database.resolveBet(betId, endPriceData.price, result);

    // Capture bet result for monitoring
    captureBet(bet, result);

    // Move to history
    this.activeBets.delete(betId);
    const userHistory = this.betHistory.get(bet.userWallet) || [];
    userHistory.push(bet);
    this.betHistory.set(bet.userWallet, userHistory);

    console.log(`Successfully resolved bet ${betId}: ${won ? 'WON' : 'LOST'}`);
    
    // Remove from resolving set
    this.resolvingBets.delete(betId);
    
    return result;
    } catch (error) {
      // Remove from resolving set on error
      this.resolvingBets.delete(betId);
      
      captureError(error as Error, {
        method: 'resolveBet',
        betId,
      });
      throw error;
    }
  }

  getActiveBet(betId: string): FlipBet | undefined {
    return this.activeBets.get(betId);
  }

  getUserBets(wallet: string): FlipBet[] {
    const betIds = this.userBets.get(wallet) || [];
    return betIds.map(id => this.activeBets.get(id) || this.getHistoricalBet(id))
                .filter(bet => bet !== undefined) as FlipBet[];
  }

  private getHistoricalBet(betId: string): FlipBet | undefined {
    for (const [wallet, bets] of this.betHistory) {
      const bet = bets.find(b => b.id === betId);
      if (bet) return bet;
    }
    return undefined;
  }

  private async checkRateLimits(wallet: string): Promise<void> {
    const userBets = this.getUserBets(wallet);
    const now = Date.now();
    
    // Check per minute limit
    const recentBets = userBets.filter(bet => 
      bet.startTime > now - 60000 && bet.status === 'PENDING'
    );
    
    if (recentBets.length >= CONFIG.MAX_BETS_PER_MINUTE) {
      throw new Error(`Maximum ${CONFIG.MAX_BETS_PER_MINUTE} bets per minute reached`);
    }

    // Check per hour limit
    const hourlyBets = userBets.filter(bet => 
      bet.startTime > now - 3600000
    );
    
    if (hourlyBets.length >= CONFIG.MAX_BETS_PER_HOUR) {
      throw new Error(`Maximum ${CONFIG.MAX_BETS_PER_HOUR} bets per hour reached`);
    }
  }

  private generateBetId(): string {
    return `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getActiveBetsCount(): number {
    return this.activeBets.size;
  }

  getTotalVolume(): number {
    const allBets = [
      ...Array.from(this.activeBets.values()),
      ...Array.from(this.betHistory.values()).flat()
    ];
    
    return allBets.reduce((sum, bet) => sum + bet.amount, 0);
  }

  getActiveBets(): FlipBet[] {
    return Array.from(this.activeBets.values());
  }

  // Safe resolution method for UI that doesn't throw errors
  async safeResolveBet(betId: string): Promise<GameResult | null> {
    try {
      return await this.resolveBet(betId);
    } catch (error) {
      console.warn(`Safe resolution failed for bet ${betId}:`, error);
      return null;
    }
  }

  // Database integration methods
  async getUserStats(walletAddress: string): Promise<UserStats> {
    return database.getOrCreateUser(walletAddress);
  }

  async getUserBetHistory(walletAddress: string, limit: number = 50): Promise<FlipBet[]> {
    return database.getBetHistory(walletAddress, limit);
  }

  async getLeaderboard(type: 'winnings' | 'win_rate' | 'volume' = 'winnings', limit: number = 100): Promise<LeaderboardEntry[]> {
    return database.getLeaderboard(type, limit);
  }

  async getGlobalStats(): Promise<any> {
    return database.getGlobalStats();
  }
}

export const gameManager = new GameManager();