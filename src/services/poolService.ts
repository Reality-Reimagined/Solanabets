import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN, Idl } from '@project-serum/anchor';
import { 
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createInitializeAccountInstruction,
  getMinimumBalanceForRentExemptAccount,
} from '@solana/spl-token';
import { IDL } from '../idl/betting_pools';
import { PoolState, CreatePoolParams } from '../types/pool';
import { OracleData } from '../types/oracle';

interface WalletProvider {
  publicKey?: PublicKey;
  connect(): Promise<string>;
  connection: Connection;
}

type ProgramType = Program<Idl>;

export class PoolService {
  private program: ProgramType | null = null;
  private anchorProvider: AnchorProvider | null = null;
  private connection: Connection;
  private provider: WalletProvider;
  private treasuryAccount: PublicKey;

  constructor(provider: WalletProvider) {
    if (!provider.connection || !provider.publicKey) {
      throw new Error('Provider must have connection and publicKey');
    }

    this.provider = provider;
    this.connection = provider.connection;
    
    const programId = import.meta.env.VITE_PROGRAM_ID;
    const treasuryAccount = import.meta.env.VITE_TREASURY_ACCOUNT;

    if (!programId || !treasuryAccount) {
      throw new Error('Missing required environment variables');
    }

    this.treasuryAccount = new PublicKey(treasuryAccount);
  }

  async connect() {
    try {
      if (!this.provider.publicKey) {
        await this.provider.connect();
      }

      this.anchorProvider = new AnchorProvider(
        this.connection,
        this.provider as any,
        { commitment: 'confirmed' }
      );

      this.program = new Program(
        IDL,
        new PublicKey(import.meta.env.VITE_PROGRAM_ID),
        this.anchorProvider
      ) as ProgramType;

      return true;
    } catch (error) {
      console.error('Failed to initialize program:', error);
      throw error;
    }
  }

  async ensureConnected() {
    if (!this.program || !this.anchorProvider) {
      await this.connect();
    }
    if (!this.program || !this.anchorProvider) {
      throw new Error('Program not initialized');
    }
  }

  async createPool(id: string, p0: number, p1: number, params: CreatePoolParams) {
    await this.ensureConnected();
    if (!this.program) throw new Error('Program not initialized');

    const pool = web3.Keypair.generate();
    const poolTokenAccount = web3.Keypair.generate();
    
    // Create token accounts for the pool
    const createTokenAccountIx = await this.createTokenAccountInstruction(poolTokenAccount.publicKey);
    
    await this.program.methods
      .initializePool(
        params.eventId,
        params.initialOddsHome * 100, // Convert to basis points
        params.initialOddsAway * 100,
        new BN(params.minBet * LAMPORTS_PER_SOL),
        new BN(params.maxBet * LAMPORTS_PER_SOL)
      )
      .accounts({
        pool: pool.publicKey,
        authority: this.provider.publicKey,
        systemProgram: web3.SystemProgram.programId,
        poolTokenAccount: poolTokenAccount.publicKey,
        treasuryAccount: this.treasuryAccount,
      })
      .preInstructions([createTokenAccountIx])
      .signers([pool, poolTokenAccount])
      .rpc();

    return {
      poolAddress: pool.publicKey,
      poolTokenAccount: poolTokenAccount.publicKey,
    };
  }

  async placeBet(
    poolAddress: PublicKey,
    amount: number,
    team: 'home' | 'away'
  ) {
    await this.ensureConnected();
    if (!this.program) throw new Error('Program not initialized');

    const betterTokenAccount = await this.getOrCreateAssociatedTokenAccount(
      this.provider.publicKey!
    );

    await this.program.methods
      .placeBet(
        new BN(amount),
        team
      )
      .accounts({
        pool: poolAddress,
        better: this.provider.publicKey,
        betterTokenAccount,
        poolTokenAccount: await this.getPoolTokenAccount(poolAddress),
        treasuryAccount: this.treasuryAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
  }

  async getPoolState(poolAddress: PublicKey): Promise<PoolState> {
    await this.ensureConnected();
    if (!this.program) throw new Error('Program not initialized');

    const pool = await this.program.account.pool.fetch(poolAddress) as {
      eventId: string;
      totalHomeBets: BN;
      totalAwayBets: BN;
      oddsHome: BN;
      oddsAway: BN;
      minBet: BN;
      maxBet: BN;
      feePercentage: number;
      isSettled: boolean;
      authority: PublicKey;
      winner: string | null;
      bets: {
        better: PublicKey;
        amount: BN;
        team: string;
        odds: BN;
        timestamp: BN;
      }[];
    };

    return {
      eventId: pool.eventId,
      totalHomeBets: pool.totalHomeBets.toNumber() / LAMPORTS_PER_SOL,
      totalAwayBets: pool.totalAwayBets.toNumber() / LAMPORTS_PER_SOL,
      oddsHome: pool.oddsHome.toNumber() / 100,
      oddsAway: pool.oddsAway.toNumber() / 100,
      minBet: pool.minBet.toNumber() / LAMPORTS_PER_SOL,
      maxBet: pool.maxBet.toNumber() / LAMPORTS_PER_SOL,
      feePercentage: pool.feePercentage / 100,
      isSettled: pool.isSettled,
      authority: pool.authority,
      winner: pool.winner || undefined,
      bets: pool.bets.map(bet => ({
        better: bet.better,
        amount: bet.amount.toNumber() / LAMPORTS_PER_SOL,
        team: bet.team,
        odds: bet.odds.toNumber() / 100,
        timestamp: bet.timestamp.toNumber(),
      })),
    };
  }

  private async createTokenAccountInstruction(account: PublicKey): Promise<web3.TransactionInstruction> {
    await this.ensureConnected();
    const rent = await getMinimumBalanceForRentExemptAccount(this.connection);
    
    const createAccountIx = web3.SystemProgram.createAccount({
      fromPubkey: this.provider.publicKey!,
      newAccountPubkey: account,
      space: 165,  // Size of token account
      lamports: rent,
      programId: TOKEN_PROGRAM_ID,
    });

    const initAccountIx = createInitializeAccountInstruction(
      account,
      TOKEN_PROGRAM_ID,  // mint
      this.provider.publicKey!  // owner
    );

    return web3.ComputeBudgetProgram.requestUnits({
      units: 400000,
      additionalFee: 0,
    });
  }

  private async getOrCreateAssociatedTokenAccount(owner: PublicKey): Promise<PublicKey> {
    await this.ensureConnected();
    const associatedAddress = await getAssociatedTokenAddress(
      TOKEN_PROGRAM_ID,  // mint
      owner,
      false
    );

    try {
      await this.connection.getAccountInfo(associatedAddress);
      return associatedAddress;
    } catch {
      // Account doesn't exist, create it
      const instruction = createAssociatedTokenAccountInstruction(
        this.provider.publicKey!,  // payer
        associatedAddress,
        owner,
        TOKEN_PROGRAM_ID  // mint
      );

      const transaction = new Transaction().add(instruction);
      
      await this.anchorProvider!.sendAndConfirm(transaction);
      
      return associatedAddress;
    }
  }

  // Helper method to subscribe to pool updates
  async subscribeToPool(poolAddress: PublicKey, callback: (state: PoolState) => void) {
    await this.ensureConnected();
    if (!this.program) throw new Error('Program not initialized');
    
    return this.program.account.pool.subscribe(poolAddress).addListener(
      'change',
      (account: any) => callback(this.transformPoolAccount(account))
    );
  }

  // Helper method to transform pool account data
  private transformPoolAccount(account: any): PoolState {
    return {
      eventId: account.eventId,
      totalHomeBets: account.totalHomeBets.toNumber() / LAMPORTS_PER_SOL,
      totalAwayBets: account.totalAwayBets.toNumber() / LAMPORTS_PER_SOL,
      oddsHome: account.oddsHome.toNumber() / 100,
      oddsAway: account.oddsAway.toNumber() / 100,
      minBet: account.minBet.toNumber() / LAMPORTS_PER_SOL,
      maxBet: account.maxBet.toNumber() / LAMPORTS_PER_SOL,
      feePercentage: account.feePercentage / 100,
      isSettled: account.isSettled,
      authority: account.authority,
      winner: account.winner || undefined,
      bets: account.bets.map((bet: any) => ({
        better: bet.better,
        amount: bet.amount.toNumber() / LAMPORTS_PER_SOL,
        team: bet.team,
        odds: bet.odds.toNumber() / 100,
        timestamp: bet.timestamp.toNumber(),
      })),
    };
  }

  async getOracleData(poolAddress: PublicKey): Promise<OracleData> {
    // In production, this would fetch from a real oracle like Pyth or Chainlink
    // For now, we'll simulate it with NBA API data
    try {
      const pool = await this.getPoolState(poolAddress);
      const gameData = await this.fetchGameResult(pool.eventId);
      
      return {
        winner: gameData.winner,
        timestamp: Date.now(),
        confidence: 100, // Real oracle would provide confidence level
      };
    } catch (error) {
      console.error('Failed to fetch oracle data:', error);
      throw error;
    }
  }

  private async fetchGameResult(eventId: string) {
    // In production, this would fetch from NBA's official API
    // For now, return simulated data
    return {
      winner: Math.random() > 0.5 ? 'home' : 'away',
      score: {
        home: Math.floor(90 + Math.random() * 30),
        away: Math.floor(90 + Math.random() * 30),
      },
      status: 'completed',
    };
  }

  async settlePool(poolAddress: PublicKey, oracleData: OracleData) {
    await this.ensureConnected();
    if (!this.program) throw new Error('Program not initialized');
    
    await this.program.methods
      .settlePool(oracleData.winner)
      .accounts({
        pool: poolAddress,
        authority: this.provider.publicKey!,
        poolTokenAccount: await this.getPoolTokenAccount(poolAddress),
        winnerTokenAccount: await this.getWinnerTokenAccount(poolAddress, oracleData.winner),
        poolAuthority: await this.getPoolAuthority(poolAddress),
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
  }

  async addLiquidity(poolAddress: PublicKey, amount: number) {
    await this.ensureConnected();
    if (!this.program) throw new Error('Program not initialized');

    const userTokenAccount = await this.getOrCreateAssociatedTokenAccount(
      this.provider.publicKey!
    );

    await this.program.methods
      .addLiquidity(new BN(amount))
      .accounts({
        pool: poolAddress,
        provider: this.provider.publicKey!,
        userTokenAccount,
        poolTokenAccount: await this.getPoolTokenAccount(poolAddress),
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
  }

  async removeLiquidity(poolAddress: PublicKey, amount: number) {
    await this.ensureConnected();
    if (!this.program) throw new Error('Program not initialized');

    const userTokenAccount = await this.getOrCreateAssociatedTokenAccount(
      this.provider.publicKey!
    );

    await this.program.methods
      .removeLiquidity(new BN(amount))
      .accounts({
        pool: poolAddress,
        provider: this.provider.publicKey!,
        userTokenAccount,
        poolTokenAccount: await this.getPoolTokenAccount(poolAddress),
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
  }

  private async getPoolTokenAccount(poolAddress: PublicKey): Promise<PublicKey> {
    return getAssociatedTokenAddress(
      new PublicKey(process.env.VITE_TOKEN_MINT!),
      poolAddress,
      true
    );
  }

  private async getWinnerTokenAccount(poolAddress: PublicKey, winner: string): Promise<PublicKey> {
    await this.ensureConnected();
    if (!this.program) throw new Error('Program not initialized');

    const poolAccount = await this.program.account.pool.fetch(poolAddress);
    const winnerPubkey = winner === 'home' 
      ? (poolAccount as any).homeTeam
      : (poolAccount as any).awayTeam;
    
    if (!winnerPubkey) throw new Error('Winner team not found');
    
    return getAssociatedTokenAddress(
      new PublicKey(process.env.VITE_TOKEN_MINT!),
      new PublicKey(winnerPubkey),
      true
    );
  }

  private async getPoolAuthority(poolAddress: PublicKey): Promise<PublicKey> {
    await this.ensureConnected();
    if (!this.program) throw new Error('Program not initialized');

    const [authority] = PublicKey.findProgramAddressSync(
      [Buffer.from('authority'), poolAddress.toBuffer()],
      this.program.programId
    );
    return authority;
  }
} 