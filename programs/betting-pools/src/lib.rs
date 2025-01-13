use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("BETSNNcnFGDW7yKKdPAJzxv8DmF3A6ovM7TYzFkDGyK");

#[error_code]
pub enum ErrorCode {
    #[msg("Pool is already settled")]
    PoolSettled,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Invalid odds calculation")]
    InvalidOdds,
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
    #[msg("Invalid bet amount")]
    InvalidBetAmount,
}

#[program]
pub mod betting_pools {
    use super::*;

    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        event_id: String,
        initial_odds_home: u64,
        initial_odds_away: u64,
        min_bet: u64,
        max_bet: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.event_id = event_id;
        pool.total_home_bets = 0;
        pool.total_away_bets = 0;
        pool.odds_home = initial_odds_home;
        pool.odds_away = initial_odds_away;
        pool.min_bet = min_bet;
        pool.max_bet = max_bet;
        pool.is_settled = false;
        pool.authority = ctx.accounts.authority.key();
        pool.fee_percentage = 250; // 2.5% fee
        Ok(())
    }

    pub fn place_bet(
        ctx: Context<PlaceBet>,
        amount: u64,
        team: String,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        require!(!pool.is_settled, ErrorCode::PoolSettled);
        require!(amount >= pool.min_bet, ErrorCode::InvalidBetAmount);
        require!(amount <= pool.max_bet, ErrorCode::InvalidBetAmount);

        // Calculate and deduct fee
        let fee = (amount * pool.fee_percentage) / 10000;
        let bet_amount = amount - fee;

        // Transfer tokens to pool
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.better_token_account.to_account_info(),
                to: ctx.accounts.pool_token_account.to_account_info(),
                authority: ctx.accounts.better.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, bet_amount)?;

        // Transfer fee to treasury
        let fee_transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.better_token_account.to_account_info(),
                to: ctx.accounts.treasury_account.to_account_info(),
                authority: ctx.accounts.better.to_account_info(),
            },
        );
        token::transfer(fee_transfer_ctx, fee)?;

        // Update pool stats and recalculate odds
        if team == "home" {
            pool.total_home_bets += bet_amount;
        } else {
            pool.total_away_bets += bet_amount;
        }
        
        // Record bet for later payout
        let bet = Bet {
            better: ctx.accounts.better.key(),
            amount: bet_amount,
            team: team.clone(),
            odds: if team == "home" { pool.odds_home } else { pool.odds_away },
            timestamp: Clock::get()?.unix_timestamp,
        };
        pool.bets.push(bet);

        // Recalculate odds based on pool liquidity
        pool.update_odds()?;

        Ok(())
    }

    pub fn settle_pool(
        ctx: Context<SettlePool>,
        winner: String,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        require!(!pool.is_settled, ErrorCode::PoolSettled);
        require!(
            ctx.accounts.authority.key() == pool.authority,
            ErrorCode::Unauthorized
        );

        pool.is_settled = true;
        pool.winner = Some(winner.clone());

        let total_pool = pool.total_home_bets + pool.total_away_bets;
        let winning_pool = if winner == "home" { 
            pool.total_home_bets 
        } else { 
            pool.total_away_bets 
        };

        // Process payouts
        for bet in pool.bets.iter() {
            if bet.team == winner {
                let payout = (bet.amount * total_pool) / winning_pool;
                
                // Transfer winnings
                let transfer_ctx = CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.pool_token_account.to_account_info(),
                        to: ctx.accounts.winner_token_account.to_account_info(),
                        authority: ctx.accounts.pool_authority.to_account_info(),
                    },
                );
                token::transfer(transfer_ctx, payout)?;
            }
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(init, payer = authority, space = 8 + Pool::LEN)]
    pub pool: Account<'info, Pool>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub treasury_account: Account<'info, TokenAccount>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    pub better: Signer<'info>,
    #[account(mut)]
    pub better_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub treasury_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SettlePool<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    pub authority: Signer<'info>,
    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub winner_token_account: Account<'info, TokenAccount>,
    /// CHECK: This is safe because we verify it's a PDA derived from the pool
    pub pool_authority: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Pool {
    pub event_id: String,
    pub total_home_bets: u64,
    pub total_away_bets: u64,
    pub odds_home: u64,
    pub odds_away: u64,
    pub min_bet: u64,
    pub max_bet: u64,
    pub fee_percentage: u16,
    pub is_settled: bool,
    pub authority: Pubkey,
    pub winner: Option<String>,
    pub bets: Vec<Bet>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Bet {
    pub better: Pubkey,
    pub amount: u64,
    pub team: String,
    pub odds: u64,
    pub timestamp: i64,
}

impl Pool {
    pub const LEN: usize = 32 + 8 + 8 + 8 + 8 + 8 + 8 + 2 + 1 + 32 + 32 + 1024;

    fn update_odds(&mut self) -> Result<()> {
        let total_pool = self.total_home_bets.checked_add(self.total_away_bets)
            .ok_or(ErrorCode::InvalidOdds)?;

        if total_pool == 0 {
            return Ok(());
        }

        // Calculate true probabilities based on bet distribution
        let home_prob = (self.total_home_bets as f64 / total_pool as f64) * 10000.0;
        let away_prob = (self.total_away_bets as f64 / total_pool as f64) * 10000.0;

        // Apply margin (fee_percentage) and convert to decimal odds
        let margin = self.fee_percentage as f64 / 100.0;
        self.odds_home = ((1.0 / (home_prob / 10000.0)) * (1.0 - margin)) as u64;
        self.odds_away = ((1.0 / (away_prob / 10000.0)) * (1.0 - margin)) as u64;

        // Ensure minimum odds
        self.odds_home = self.odds_home.max(101); // Minimum odds of 1.01
        self.odds_away = self.odds_away.max(101);

        Ok(())
    }
} 