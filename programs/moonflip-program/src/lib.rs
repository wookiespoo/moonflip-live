use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
use anchor_spl::token::{self, Token, TokenAccount, Mint};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod moonflip_program {
    use super::*;

    // Initialize the betting platform
    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        house_fee_bps: u16,
        min_bet: u64,
        max_bet: u64,
    ) -> Result<()> {
        let platform = &mut ctx.accounts.platform;
        platform.admin = ctx.accounts.admin.key();
        platform.house_wallet = ctx.accounts.house_wallet.key();
        platform.house_fee_bps = house_fee_bps;
        platform.min_bet = min_bet;
        platform.max_bet = max_bet;
        platform.total_bets = 0;
        platform.total_volume = 0;
        platform.is_active = true;
        
        emit!(PlatformInitialized {
            admin: platform.admin,
            house_wallet: platform.house_wallet,
            house_fee_bps,
            min_bet,
            max_bet,
        });
        
        Ok(())
    }

    // Create a new betting game
    pub fn create_bet(
        ctx: Context<CreateBet>,
        amount: u64,
        prediction: bool, // true = up, false = down
        duration: i64,
        token_mint: Pubkey,
    ) -> Result<()> {
        require!(ctx.accounts.platform.is_active, ErrorCode::PlatformInactive);
        require!(amount >= ctx.accounts.platform.min_bet, ErrorCode::BetTooSmall);
        require!(amount <= ctx.accounts.platform.max_bet, ErrorCode::BetTooLarge);
        
        let bet = &mut ctx.accounts.bet;
        let clock = Clock::get()?;
        
        bet.player = ctx.accounts.player.key();
        bet.amount = amount;
        bet.prediction = prediction;
        bet.token_mint = token_mint;
        bet.start_time = clock.unix_timestamp;
        bet.end_time = clock.unix_timestamp + duration;
        bet.start_price = 0; // Will be set by oracle
        bet.end_price = 0;
        bet.is_settled = false;
        bet.is_winner = false;
        bet.payout = 0;
        
        // Transfer SOL from player to bet account
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.player.to_account_info(),
                to: bet.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, amount)?;
        
        ctx.accounts.platform.total_bets += 1;
        ctx.accounts.platform.total_volume += amount;
        
        emit!(BetCreated {
            bet: bet.key(),
            player: bet.player,
            amount,
            prediction,
            duration,
            token_mint,
        });
        
        Ok(())
    }

    // Settle a bet (called by oracle/admin)
    pub fn settle_bet(
        ctx: Context<SettleBet>,
        end_price: u64,
    ) -> Result<()> {
        let bet = &mut ctx.accounts.bet;
        let clock = Clock::get()?;
        
        require!(!bet.is_settled, ErrorCode::BetAlreadySettled);
        require!(clock.unix_timestamp >= bet.end_time, ErrorCode::BetNotExpired);
        
        bet.end_price = end_price;
        bet.is_settled = true;
        
        // Determine winner
        bet.is_winner = if bet.prediction {
            end_price > bet.start_price
        } else {
            end_price < bet.start_price
        };
        
        if bet.is_winner {
            // Calculate payout (90% of bet amount for now)
            let payout = bet.amount * 90 / 100;
            bet.payout = payout;
            
            // Transfer winnings to player
            let bet_account = bet.to_account_info();
            let player_account = ctx.accounts.player.to_account_info();
            
            **player_account.lamports.borrow_mut() += payout;
            **bet_account.lamports.borrow_mut() -= payout;
        }
        
        emit!(BetSettled {
            bet: bet.key(),
            player: bet.player,
            end_price,
            is_winner: bet.is_winner,
            payout: bet.payout,
        });
        
        Ok(())
    }

    // Update bet start price (called by oracle)
    pub fn update_bet_price(
        ctx: Context<UpdateBetPrice>,
        start_price: u64,
    ) -> Result<()> {
        let bet = &mut ctx.accounts.bet;
        
        require!(!bet.is_settled, ErrorCode::BetAlreadySettled);
        require!(bet.start_price == 0, ErrorCode::PriceAlreadySet);
        
        bet.start_price = start_price;
        
        emit!(BetPriceUpdated {
            bet: bet.key(),
            start_price,
        });
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(init, payer = admin, space = 8 + 32 + 32 + 2 + 8 + 8 + 8 + 8 + 1)]
    pub platform: Account<'info, Platform>,
    #[account(mut)]
    pub admin: Signer<'info>,
    /// CHECK: This is the house wallet
    pub house_wallet: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateBet<'info> {
    #[account(init, payer = player, space = 8 + 32 + 8 + 1 + 32 + 8 + 8 + 8 + 8 + 1 + 1 + 8)]
    pub bet: Account<'info, Bet>,
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut)]
    pub platform: Account<'info, Platform>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SettleBet<'info> {
    #[account(mut)]
    pub bet: Account<'info, Bet>,
    #[account(mut)]
    pub player: SystemAccount<'info>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateBetPrice<'info> {
    #[account(mut)]
    pub bet: Account<'info, Bet>,
    pub authority: Signer<'info>,
}

#[account]
pub struct Platform {
    pub admin: Pubkey,           // 32
    pub house_wallet: Pubkey,     // 32
    pub house_fee_bps: u16,        // 2
    pub min_bet: u64,              // 8
    pub max_bet: u64,              // 8
    pub total_bets: u64,           // 8
    pub total_volume: u64,         // 8
    pub is_active: bool,           // 1
}

#[account]
pub struct Bet {
    pub player: Pubkey,            // 32
    pub amount: u64,               // 8
    pub prediction: bool,          // 1 (true = up, false = down)
    pub token_mint: Pubkey,        // 32
    pub start_time: i64,           // 8
    pub end_time: i64,             // 8
    pub start_price: u64,          // 8
    pub end_price: u64,            // 8
    pub is_settled: bool,          // 1
    pub is_winner: bool,           // 1
    pub payout: u64,               // 8
}

#[event]
pub struct PlatformInitialized {
    pub admin: Pubkey,
    pub house_wallet: Pubkey,
    pub house_fee_bps: u16,
    pub min_bet: u64,
    pub max_bet: u64,
}

#[event]
pub struct BetCreated {
    pub bet: Pubkey,
    pub player: Pubkey,
    pub amount: u64,
    pub prediction: bool,
    pub duration: i64,
    pub token_mint: Pubkey,
}

#[event]
pub struct BetSettled {
    pub bet: Pubkey,
    pub player: Pubkey,
    pub end_price: u64,
    pub is_winner: bool,
    pub payout: u64,
}

#[event]
pub struct BetPriceUpdated {
    pub bet: Pubkey,
    pub start_price: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Platform is inactive")]
    PlatformInactive,
    #[msg("Bet amount too small")]
    BetTooSmall,
    #[msg("Bet amount too large")]
    BetTooLarge,
    #[msg("Bet already settled")]
    BetAlreadySettled,
    #[msg("Bet not expired")]
    BetNotExpired,
    #[msg("Price already set")]
    PriceAlreadySet,
}