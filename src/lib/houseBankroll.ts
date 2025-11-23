import { CONFIG } from './config';

export interface BankrollTransaction {
  type: 'BET_PLACED' | 'WIN_PAYOUT' | 'OWNER_FEE' | 'REFERRAL_FEE';
  amount: number;
  betId?: string;
  userWallet?: string;
  timestamp: number;
  details?: any;
}

export class HouseBankrollManager {
  private bankrollBalance: number = 0;
  private transactions: BankrollTransaction[] = [];
  private ownerWallet: string = CONFIG.HOUSE_WALLET;
  private minimumBankroll: number = 100; // SOL
  private isPaused: boolean = false;

  constructor(initialBankroll: number = 1000) {
    this.bankrollBalance = initialBankroll;
    console.log(`🏦 House bankroll initialized with ${initialBankroll} SOL`);
  }

  // Get current bankroll balance
  getBankrollBalance(): number {
    return this.bankrollBalance;
  }

  // Check if bankroll is sufficient for operations
  isBankrollSufficient(): boolean {
    return this.bankrollBalance >= this.minimumBankroll;
  }

  // Check if betting is paused due to low bankroll
  isBettingPaused(): boolean {
    return this.isPaused;
  }

  // Get pause status with reason
  getBettingStatus(): { paused: boolean; reason?: string; bankroll: number } {
    if (this.isPaused) {
      return { 
        paused: true, 
        reason: 'House bankroll below minimum threshold - refueling in progress',
        bankroll: this.bankrollBalance 
      };
    }
    
    if (!this.isBankrollSufficient()) {
      return { 
        paused: true, 
        reason: 'Insufficient house bankroll - minimum 100 SOL required',
        bankroll: this.bankrollBalance 
      };
    }
    
    return { paused: false, bankroll: this.bankrollBalance };
  }

  // Add funds to bankroll (from losing bets)
  addToBankroll(amount: number, betId: string, userWallet: string): void {
    this.bankrollBalance += amount;
    
    const transaction: BankrollTransaction = {
      type: 'BET_PLACED',
      amount,
      betId,
      userWallet,
      timestamp: Date.now(),
      details: { action: 'bet_placed', previousBalance: this.bankrollBalance - amount }
    };
    
    this.transactions.push(transaction);
    
    console.log(`🏦 Bankroll +${amount} SOL (bet ${betId}) → ${this.bankrollBalance} SOL`);
    
    // Check if we should unpause betting
    if (this.isPaused && this.isBankrollSufficient()) {
      this.isPaused = false;
      console.log('🎰 Betting resumed - bankroll restored');
    }
  }

  // Process win payout (deduct from bankroll)
  processWinPayout(betId: string, userWallet: string, originalBet: number, payoutAmount: number): { 
    success: boolean; 
    ownerFee: number; 
    referralFee: number;
    netPayout: number;
    error?: string;
  } {
    // Check if we have sufficient bankroll
    if (this.bankrollBalance < payoutAmount) {
      console.error(`❌ Insufficient bankroll for payout: need ${payoutAmount}, have ${this.bankrollBalance}`);
      return { 
        success: false, 
        ownerFee: 0, 
        referralFee: 0, 
        netPayout: 0,
        error: 'Insufficient house bankroll for payout' 
      };
    }

    // Calculate fees
    const profitAmount = payoutAmount - originalBet;
    const ownerFee = profitAmount * CONFIG.HOUSE_FEE; // 4% of profit
    const referralFee = profitAmount * CONFIG.REFERRAL_FEE; // 1% of profit
    const netPayout = payoutAmount - ownerFee - referralFee;

    // Deduct from bankroll
    this.bankrollBalance -= netPayout;

    // Log transactions
    const payoutTransaction: BankrollTransaction = {
      type: 'WIN_PAYOUT',
      amount: netPayout,
      betId,
      userWallet,
      timestamp: Date.now(),
      details: { 
        originalBet, 
        totalPayout: payoutAmount, 
        ownerFee, 
        referralFee, 
        netPayout,
        previousBalance: this.bankrollBalance + netPayout
      }
    };
    
    this.transactions.push(payoutTransaction);

    // Log owner fee transaction
    if (ownerFee > 0) {
      const ownerFeeTransaction: BankrollTransaction = {
        type: 'OWNER_FEE',
        amount: ownerFee,
        betId,
        userWallet: this.ownerWallet,
        timestamp: Date.now(),
        details: { recipient: this.ownerWallet, fromProfit: profitAmount }
      };
      this.transactions.push(ownerFeeTransaction);
    }

    console.log(`💰 Win payout: ${netPayout} SOL (total ${payoutAmount}, fees: owner ${ownerFee}, referral ${referralFee}) → Bankroll: ${this.bankrollBalance} SOL`);

    return { 
      success: true, 
      ownerFee, 
      referralFee, 
      netPayout 
    };
  }

  // Get recent transactions for monitoring
  getRecentTransactions(limit: number = 10): BankrollTransaction[] {
    return this.transactions.slice(-limit);
  }

  // Get bankroll statistics
  getBankrollStats() {
    const totalIn = this.transactions
      .filter(t => t.type === 'BET_PLACED')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalOut = this.transactions
      .filter(t => t.type === 'WIN_PAYOUT')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalFees = this.transactions
      .filter(t => t.type === 'OWNER_FEE')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      currentBalance: this.bankrollBalance,
      totalIn,
      totalOut,
      totalFees,
      netProfit: totalIn - totalOut - totalFees,
      transactionCount: this.transactions.length
    };
  }

  // Emergency pause/resume
  pauseBetting(reason: string): void {
    this.isPaused = true;
    console.log(`🛑 Betting paused: ${reason}`);
  }

  resumeBetting(): void {
    if (this.isBankrollSufficient()) {
      this.isPaused = false;
      console.log('🎰 Betting resumed');
    } else {
      console.log('❌ Cannot resume betting - insufficient bankroll');
    }
  }
}

// Singleton instance
export const houseBankrollManager = new HouseBankrollManager(1847); // Start with 1847 SOL as mentioned