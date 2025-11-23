export interface Memecoin {
  address: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
}

export interface FlipBet {
  id: string;
  userWallet: string;
  coinAddress: string;
  coinSymbol: string;
  amount: number;
  direction: 'GREEN' | 'RED';
  startPrice: number;
  endPrice?: number;
  startTime: number;
  endTime?: number;
  status: 'PENDING' | 'WON' | 'LOST' | 'CANCELLED';
  payout?: number;
  signature?: string;
  referral?: string;
}

export interface GameResult {
  bet: FlipBet;
  won: boolean;
  profit: number;
  payoutAmount: number;
  feeAmount: number;
  referralAmount?: number;
}

export interface UserStats {
  wallet_address: string;
  created_at: number;
  total_bets: number;
  total_wagered: number;
  total_won: number;
  total_lost: number;
  win_rate: number;
  biggest_win: number;
  current_streak: number;
  best_streak: number;
}

export interface LeaderboardEntry {
  wallet_address: string;
  total_bets: number;
  total_wagered: number;
  total_won: number;
  total_lost: number;
  win_rate: number;
  biggest_win: number;
  best_streak: number;
  rank: number;
  profit: number;
}

export interface PriceData {
  price: number;
  timestamp: number;
  confidence: number;
}

export interface JupiterToken {
  address: string;
  symbol: string;
  name: string;
  image: string;
  verified: boolean;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
}