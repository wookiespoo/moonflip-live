import { Connection, PublicKey, Transaction, SystemProgram, SendTransactionError } from '@solana/web3.js';
import { CONFIG } from './config';

export class SolanaService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(CONFIG.SOLANA_RPC, 'confirmed');
  }

  async sendPayout(
    fromWallet: string,
    toWallet: string,
    amount: number,
    feeAmount: number,
    referralAmount?: number,
    referralWallet?: string
  ): Promise<string> {
    try {
      // Create transaction
      const transaction = new Transaction();
      
      // Add main payout
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(fromWallet),
          toPubkey: new PublicKey(toWallet),
          lamports: Math.floor(amount * 1e9), // Convert SOL to lamports
        })
      );

      // Add house fee
      if (feeAmount > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: new PublicKey(fromWallet),
            toPubkey: new PublicKey(CONFIG.HOUSE_WALLET),
            lamports: Math.floor(feeAmount * 1e9),
          })
        );
      }

      // Add referral fee
      if (referralAmount && referralAmount > 0 && referralWallet) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: new PublicKey(fromWallet),
            toPubkey: new PublicKey(referralWallet),
            lamports: Math.floor(referralAmount * 1e9),
          })
        );
      }

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(fromWallet);

      // In a real implementation, you would sign and send the transaction
      // For now, we'll simulate the transaction
      console.log('Simulating payout transaction:', {
        from: fromWallet,
        to: toWallet,
        amount,
        feeAmount,
        referralAmount,
        referralWallet,
      });

      // Simulate transaction signature
      const simulatedSignature = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return simulatedSignature;
    } catch (error) {
      console.error('Error sending payout:', error);
      throw new Error('Failed to send payout');
    }
  }

  async validateWallet(walletAddress: string): Promise<boolean> {
    try {
      const publicKey = new PublicKey(walletAddress);
      return PublicKey.isOnCurve(publicKey.toBytes());
    } catch (error) {
      return false;
    }
  }

  async getBalance(walletAddress: string): Promise<number> {
    try {
      const publicKey = new PublicKey(walletAddress);
      const balance = await this.connection.getBalance(publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error('Error getting balance:', error);
      return 0;
    }
  }

  async getTransactionStatus(signature: string): Promise<'confirmed' | 'failed' | 'pending'> {
    try {
      const status = await this.connection.getSignatureStatus(signature);
      
      if (!status.value) {
        return 'pending';
      }

      if (status.value.err) {
        return 'failed';
      }

      return 'confirmed';
    } catch (error) {
      console.error('Error getting transaction status:', error);
      return 'failed';
    }
  }

  formatSolAmount(amount: number): string {
    return amount.toFixed(4);
  }

  calculatePayoutAmount(betAmount: number): number {
    return betAmount * CONFIG.PAYOUT_MULTIPLIER;
  }

  calculateFeeAmount(winAmount: number): number {
    return winAmount * CONFIG.HOUSE_FEE;
  }

  calculateReferralAmount(winAmount: number): number {
    return winAmount * CONFIG.REFERRAL_FEE;
  }
}

export const solanaService = new SolanaService();