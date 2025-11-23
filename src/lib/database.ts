import { FlipBet, GameResult, UserStats, LeaderboardEntry } from './types';

// Make this a dynamic import to avoid client-side issues
let Database: any;
let path: any;

class DatabaseManager {
  private db: any;
  private initialized = false;

  constructor() {
    // Lazy initialization - only when first method is called
  }

  private ensureInitialized(): void {
    if (this.initialized || typeof window !== 'undefined') return;
    
    try {
      Database = require('better-sqlite3');
      path = require('path');
      
      const dbPath = process.env.NODE_ENV === 'production' 
        ? '/tmp/moonflip.db' 
        : path.join(process.cwd(), 'moonflip.db');
      
      this.db = new Database(dbPath);
      this.initializeTables();
      this.initialized = true;
    } catch (error) {
      console.error('Database initialization failed:', error);
      // In development, we can continue without database
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Running without database - some features may not work');
        this.initialized = true;
      } else {
        throw error;
      }
    }
  }

  private getFallbackUserStats(walletAddress: string): UserStats {
    return {
      wallet_address: walletAddress,
      created_at: Date.now(),
      total_bets: 0,
      total_wagered: 0,
      total_won: 0,
      total_lost: 0,
      win_rate: 0,
      biggest_win: 0,
      current_streak: 0,
      best_streak: 0
    };
  }

  private getFallbackAdminStats(): any {
    return {
      totalBets: 0,
      activeBets: 0,
      completedBets: 0,
      totalVolume: 0,
      totalWon: 0,
      totalLost: 0,
      houseProfit: 0,
      recentBets: [],
      topUsers: []
    };
  }

  private getFallbackGlobalAnalytics(): any {
    return {
      hourlyVolume: [],
      coinStats: [],
      dailyStats: [],
      referralStats: [],
      hourlyActivity: [],
      coinPerformance: []
    };
  }

  private initializeTables(): void {
    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        wallet_address TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL,
        total_bets INTEGER DEFAULT 0,
        total_wagered REAL DEFAULT 0,
        total_won REAL DEFAULT 0,
        total_lost REAL DEFAULT 0,
        win_rate REAL DEFAULT 0,
        biggest_win REAL DEFAULT 0,
        current_streak INTEGER DEFAULT 0,
        best_streak INTEGER DEFAULT 0
      )
    `);

    // Bets table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bets (
        id TEXT PRIMARY KEY,
        user_wallet TEXT NOT NULL,
        coin_address TEXT NOT NULL,
        coin_symbol TEXT NOT NULL,
        amount REAL NOT NULL,
        direction TEXT NOT NULL,
        start_price REAL NOT NULL,
        end_price REAL,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        status TEXT NOT NULL,
        result TEXT,
        profit REAL DEFAULT 0,
        referral_wallet TEXT,
        referral_amount REAL DEFAULT 0,
        fee_amount REAL DEFAULT 0,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_wallet) REFERENCES users(wallet_address)
      )
    `);

    // Migration for existing databases - only add columns if they don't exist
    try {
      const tableInfo = this.db.prepare("PRAGMA table_info(bets)").all();
      const hasReferralAmount = tableInfo.some((col: any) => col.name === 'referral_amount');
      const hasFeeAmount = tableInfo.some((col: any) => col.name === 'fee_amount');
      
      if (!hasReferralAmount) {
        this.db.exec(`ALTER TABLE bets ADD COLUMN referral_amount REAL DEFAULT 0`);
      }
      
      if (!hasFeeAmount) {
        this.db.exec(`ALTER TABLE bets ADD COLUMN fee_amount REAL DEFAULT 0`);
      }
    } catch (e) {
      console.error('Migration error:', e);
      // Continue even if migration fails
    }

    // Create indexes for performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_bets_user_wallet ON bets(user_wallet);
      CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);
      CREATE INDEX IF NOT EXISTS idx_bets_start_time ON bets(start_time);
      CREATE INDEX IF NOT EXISTS idx_users_stats ON users(total_won DESC, win_rate DESC);
    `);
  }

  // User management
  async getOrCreateUser(walletAddress: string): Promise<UserStats> {
    this.ensureInitialized();
    if (!this.db) return this.getFallbackUserStats(walletAddress);
    
    const user = this.db.prepare('SELECT * FROM users WHERE wallet_address = ?').get(walletAddress) as UserStats;
    
    if (user) {
      return user;
    }

    const newUser: UserStats = {
      wallet_address: walletAddress,
      created_at: Date.now(),
      total_bets: 0,
      total_wagered: 0,
      total_won: 0,
      total_lost: 0,
      win_rate: 0,
      biggest_win: 0,
      current_streak: 0,
      best_streak: 0
    };

    this.db.prepare(`
      INSERT INTO users (wallet_address, created_at, total_bets, total_wagered, total_won, total_lost, win_rate, biggest_win, current_streak, best_streak)
      VALUES (?, ?, 0, 0, 0, 0, 0, 0, 0, 0)
    `).run(walletAddress, Date.now());

    return newUser;
  }

  // Bet management
  async createBet(bet: Omit<FlipBet, 'endPrice' | 'endTime' | 'status'> & { status: 'PENDING' }): Promise<void> {
    this.ensureInitialized();
    if (!this.db) return;
    
    const stmt = this.db.prepare(`
      INSERT INTO bets (id, user_wallet, coin_address, coin_symbol, amount, direction, start_price, start_time, status, referral_wallet, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      bet.id,
      bet.userWallet,
      bet.coinAddress,
      bet.coinSymbol,
      bet.amount,
      bet.direction,
      bet.startPrice,
      bet.startTime,
      bet.status,
      bet.referral || null,
      Date.now()
    );

    // Update user stats
    this.db.prepare(`
      UPDATE users SET 
        total_bets = total_bets + 1,
        total_wagered = total_wagered + ?
      WHERE wallet_address = ?
    `).run(bet.amount, bet.userWallet);
  }

  async resolveBet(betId: string, endPrice: number, result: GameResult): Promise<void> {
    this.ensureInitialized();
    if (!this.db) return;
    
    const endTime = Date.now();
    const profit = result.won ? result.payoutAmount - result.bet.amount : -result.bet.amount;

    // Update bet
    this.db.prepare(`
      UPDATE bets SET 
        end_price = ?,
        end_time = ?,
        status = ?,
        result = ?,
        profit = ?
      WHERE id = ?
    `).run(endPrice, endTime, 'COMPLETED', result.won ? 'WON' : 'LOST', profit, betId);

    // Update user stats
    const bet = this.db.prepare('SELECT * FROM bets WHERE id = ?').get(betId) as any;
    const userStats = await this.getOrCreateUser(bet.user_wallet);

    const newTotalWon = result.won ? userStats.total_won + result.payoutAmount : userStats.total_won;
    const newTotalLost = !result.won ? userStats.total_lost + result.bet.amount : userStats.total_lost;
    const newWinRate = ((userStats.total_bets - 1) * userStats.win_rate + (result.won ? 100 : 0)) / userStats.total_bets;
    const newBiggestWin = result.won && result.payoutAmount > userStats.biggest_win ? result.payoutAmount : userStats.biggest_win;
    const newCurrentStreak = result.won ? userStats.current_streak + 1 : 0;
    const newBestStreak = newCurrentStreak > userStats.best_streak ? newCurrentStreak : userStats.best_streak;

    this.db.prepare(`
      UPDATE users SET 
        total_won = ?,
        total_lost = ?,
        win_rate = ?,
        biggest_win = ?,
        current_streak = ?,
        best_streak = ?
      WHERE wallet_address = ?
    `).run(
      newTotalWon,
      newTotalLost,
      newWinRate,
      newBiggestWin,
      newCurrentStreak,
      newBestStreak,
      bet.user_wallet
    );
  }

  async getActiveBets(walletAddress?: string): Promise<FlipBet[]> {
    this.ensureInitialized();
    if (!this.db) return [];
    
    let query = 'SELECT * FROM bets WHERE status = ?';
    const params = ['PENDING'];
    
    if (walletAddress) {
      query += ' AND user_wallet = ?';
      params.push(walletAddress);
    }
    
    query += ' ORDER BY start_time DESC';
    
    return this.db.prepare(query).all(...params) as FlipBet[];
  }

  async getBetHistory(walletAddress: string, limit: number = 50): Promise<FlipBet[]> {
    this.ensureInitialized();
    if (!this.db) return [];
    
    return this.db.prepare(`
      SELECT * FROM bets 
      WHERE user_wallet = ? AND status = 'COMPLETED'
      ORDER BY end_time DESC 
      LIMIT ?
    `).all(walletAddress, limit) as FlipBet[];
  }

  async getAdminStats(): Promise<any> {
    this.ensureInitialized();
    if (!this.db) return this.getFallbackAdminStats();
    
    const totalBets = this.db.prepare('SELECT COUNT(*) as count FROM bets').get() as { count: number };
    const activeBets = this.db.prepare('SELECT COUNT(*) as count FROM bets WHERE status = ?').get('PENDING') as { count: number };
    const completedBets = this.db.prepare('SELECT COUNT(*) as count FROM bets WHERE status = ?').get('COMPLETED') as { count: number };
    
    const totalVolume = this.db.prepare('SELECT SUM(amount) as total FROM bets').get() as { total: number };
    const totalWon = this.db.prepare('SELECT SUM(amount) as total FROM bets WHERE status = ?').get('WON') as { total: number };
    const totalLost = this.db.prepare('SELECT SUM(amount) as total FROM bets WHERE status = ?').get('LOST') as { total: number };
    
    const houseProfit = this.db.prepare('SELECT SUM(fee_amount) as total FROM bets WHERE status = ?').get('COMPLETED') as { total: number };
    
    const recentBets = this.db.prepare(`
      SELECT * FROM bets 
      ORDER BY start_time DESC 
      LIMIT 10
    `).all() as FlipBet[];
    
    const topUsers = this.db.prepare(`
      SELECT 
        wallet_address,
        total_bets,
        total_won,
        total_lost,
        win_rate,
        biggest_win
      FROM users 
      ORDER BY total_won DESC 
      LIMIT 10
    `).all() as any[];

    return {
      totalBets: totalBets.count,
      activeBets: activeBets.count,
      completedBets: completedBets.count,
      totalVolume: totalVolume.total || 0,
      totalWon: totalWon.total || 0,
      totalLost: totalLost.total || 0,
      houseProfit: houseProfit.total || 0,
      recentBets,
      topUsers
    };
  }

  async getUserAnalytics(walletAddress: string): Promise<any> {
    this.ensureInitialized();
    if (!this.db) {
      return {
        userStats: this.getFallbackUserStats(walletAddress),
        recentBets: [],
        bettingPattern: [],
        hourlyActivity: [],
        coinPerformance: []
      };
    }
    
    const userStats = this.db.prepare(`
      SELECT * FROM users WHERE wallet_address = ?
    `).get(walletAddress) as any;

    if (!userStats) {
      return {
        userStats: this.getFallbackUserStats(walletAddress),
        recentBets: [],
        bettingPattern: [],
        hourlyActivity: [],
        coinPerformance: []
      };
    }

    const recentBets = this.db.prepare(`
      SELECT * FROM bets 
      WHERE user_wallet = ? 
      ORDER BY start_time DESC 
      LIMIT 20
    `).all(walletAddress) as FlipBet[];

    const bettingPattern = this.db.prepare(`
      SELECT 
        direction,
        COUNT(*) as count,
        AVG(amount) as avg_amount,
        SUM(CASE WHEN status = 'WON' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN status = 'LOST' THEN 1 ELSE 0 END) as losses
      FROM bets 
      WHERE user_wallet = ? 
      GROUP BY direction
    `).all(walletAddress) as any[];

    const hourlyActivity = this.db.prepare(`
      SELECT 
        strftime('%H', datetime(start_time / 1000, 'unixepoch')) as hour,
        COUNT(*) as count
      FROM bets 
      WHERE user_wallet = ? 
      GROUP BY hour
      ORDER BY hour
    `).all(walletAddress) as any[];

    const coinPerformance = this.db.prepare(`
      SELECT 
        coin_symbol,
        COUNT(*) as bets,
        SUM(CASE WHEN status = 'WON' THEN 1 ELSE 0 END) as wins,
        AVG(amount) as avg_amount
      FROM bets 
      WHERE user_wallet = ? 
      GROUP BY coin_symbol
      ORDER BY bets DESC
    `).all(walletAddress) as any[];

    return {
      userStats,
      recentBets,
      bettingPattern,
      hourlyActivity,
      coinPerformance
    };
  }

  async getGlobalAnalytics(): Promise<any> {
    this.ensureInitialized();
    if (!this.db) return this.getFallbackGlobalAnalytics();
    
    const hourlyVolume = this.db.prepare(`
      SELECT 
        strftime('%H', datetime(start_time / 1000, 'unixepoch')) as hour,
        COUNT(*) as bets,
        SUM(amount) as volume
      FROM bets 
      GROUP BY hour
      ORDER BY hour
    `).all() as any[];

    const coinStats = this.db.prepare(`
      SELECT 
        coin_symbol,
        COUNT(*) as bets,
        SUM(amount) as volume,
        SUM(CASE WHEN status = 'WON' THEN 1 ELSE 0 END) as wins,
        AVG(CASE WHEN end_price > start_price THEN 1.0 ELSE 0.0 END) as green_ratio
      FROM bets 
      GROUP BY coin_symbol
      ORDER BY volume DESC
      LIMIT 20
    `).all() as any[];

    const dailyStats = this.db.prepare(`
      SELECT 
        date(datetime(start_time / 1000, 'unixepoch')) as date,
        COUNT(*) as bets,
        SUM(amount) as volume,
        SUM(CASE WHEN status = 'WON' THEN amount ELSE 0 END) as won,
        SUM(CASE WHEN status = 'LOST' THEN amount ELSE 0 END) as lost
      FROM bets 
      WHERE start_time > datetime('now', '-7 days')
      GROUP BY date
      ORDER BY date DESC
    `).all() as any[];

    const referralStats = this.db.prepare(`
      SELECT 
        referral_wallet,
        COUNT(*) as referrals,
        SUM(referral_amount) as total_earned
      FROM bets 
      WHERE referral_wallet IS NOT NULL 
      GROUP BY referral_wallet
      ORDER BY total_earned DESC
      LIMIT 10
    `).all() as any[];

    return {
      hourlyVolume,
      coinStats,
      dailyStats,
      referralStats
    };
  }

  // Leaderboard functions
  async getLeaderboard(type: 'winnings' | 'win_rate' | 'volume' = 'winnings', limit: number = 100): Promise<LeaderboardEntry[]> {
    this.ensureInitialized();
    if (!this.db) return [];
    
    let orderBy = 'total_won DESC';
    
    switch (type) {
      case 'win_rate':
        orderBy = 'win_rate DESC, total_bets DESC';
        break;
      case 'volume':
        orderBy = 'total_wagered DESC';
        break;
    }

    const users = this.db.prepare(`
      SELECT 
        wallet_address,
        total_bets,
        total_wagered,
        total_won,
        total_lost,
        win_rate,
        biggest_win,
        best_streak
      FROM users 
      WHERE total_bets > 0
      ORDER BY ${orderBy}
      LIMIT ?
    `).all(limit) as LeaderboardEntry[];

    return users.map((user, index) => ({
      ...user,
      rank: index + 1,
      profit: user.total_won - user.total_lost,
    }));
  }

  // Analytics
  async getGlobalStats(): Promise<any> {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as total_users,
        SUM(total_bets) as total_bets,
        SUM(total_wagered) as total_volume,
        SUM(total_won) as total_paid_out,
        AVG(win_rate) as avg_win_rate
      FROM users 
      WHERE total_bets > 0
    `).get() as any;

    const recentActivity = this.db.prepare(`
      SELECT COUNT(*) as recent_bets, SUM(amount) as recent_volume
      FROM bets 
      WHERE start_time > ?
    `).get(Date.now() - 24 * 60 * 60 * 1000) as any;

    return {
      ...stats,
      recent_bets: recentActivity.recent_bets,
      recent_volume: recentActivity.recent_volume,
    };
  }

  close(): void {
    this.db.close();
  }
}

export const database = new DatabaseManager();