import { NextRequest, NextResponse } from 'next/server';
import { gameManager } from '@/lib/game';
import { solanaService } from '@/lib/solana';
import { CONFIG } from '@/lib/config';
import { captureError, captureSecurityEvent } from '@/lib/monitoring';
import { withSecurity, validateWalletAddress, sanitizeInput } from '@/lib/security';

export const POST = withSecurity(async (request: NextRequest) => {
  let wallet = '';
  let coinAddress = '';
  let coinSymbol = '';
  let amount = '';
  let direction = '';
  let referral = '';
  
  try {
    const body = sanitizeInput(await request.json());
    wallet = body.wallet;
    coinAddress = body.coinAddress;
    coinSymbol = body.coinSymbol;
    amount = body.amount;
    direction = body.direction;
    referral = body.referral;

    // Validate input
    if (!wallet || !coinAddress || !coinSymbol || !amount || !direction) {
      captureSecurityEvent('invalid_bet_parameters', {
        wallet: wallet ? 'provided' : 'missing',
        coinAddress: coinAddress ? 'provided' : 'missing',
        coinSymbol: coinSymbol ? 'provided' : 'missing',
        amount: amount ? 'provided' : 'missing',
        direction: direction ? 'provided' : 'missing',
      });
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Validate wallet address
    if (!validateWalletAddress(wallet)) {
      captureSecurityEvent('invalid_wallet_format', {
        wallet: wallet.slice(0, 10) + '...',
        endpoint: '/api/bet/create'
      });
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    const isValidWallet = await solanaService.validateWallet(wallet);
    if (!isValidWallet) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // Validate amount
    const betAmount = parseFloat(amount);
    if (isNaN(betAmount) || betAmount < CONFIG.MIN_BET || betAmount > CONFIG.MAX_BET) {
      return NextResponse.json(
        { error: `Bet amount must be between ${CONFIG.MIN_BET} and ${CONFIG.MAX_BET} SOL` },
        { status: 400 }
      );
    }

    // Validate direction
    if (direction !== 'GREEN' && direction !== 'RED') {
      return NextResponse.json(
        { error: 'Direction must be GREEN or RED' },
        { status: 400 }
      );
    }

    // Validate referral wallet if provided
    if (referral) {
      if (!validateWalletAddress(referral)) {
        captureSecurityEvent('invalid_referral_wallet_format', {
          referral: referral.slice(0, 10) + '...',
          endpoint: '/api/bet/create'
        });
        return NextResponse.json(
          { error: 'Invalid referral wallet address format' },
          { status: 400 }
        );
      }
      
      const isValidReferral = await solanaService.validateWallet(referral);
      if (!isValidReferral) {
        return NextResponse.json(
          { error: 'Invalid referral wallet address' },
          { status: 400 }
        );
      }
    }

    // Create bet
    const bet = await gameManager.createBet(
      wallet,
      coinAddress,
      coinSymbol,
      betAmount,
      direction,
      referral
    );

    return NextResponse.json({
      success: true,
      bet: {
        id: bet.id,
        userWallet: bet.userWallet,
        coinAddress: bet.coinAddress,
        coinSymbol: bet.coinSymbol,
        amount: bet.amount,
        direction: bet.direction,
        startPrice: bet.startPrice,
        startTime: bet.startTime,
        status: bet.status,
        referral: bet.referral,
      }
    });

  } catch (error: any) {
    console.error('Error creating bet:', error);
    captureError(error, {
      endpoint: '/api/bet/create',
      wallet: wallet || 'unknown',
      coinAddress: coinAddress || 'unknown',
      coinSymbol: coinSymbol || 'unknown',
      amount: amount || 'unknown',
      direction: direction || 'unknown',
      referral: referral || 'none',
    });
    return NextResponse.json(
      { error: error.message || 'Failed to create bet' },
      { status: 500 }
    );
  }
});