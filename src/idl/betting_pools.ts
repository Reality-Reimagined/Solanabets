import { Idl } from '@project-serum/anchor';

export const IDL: Idl = {
  version: "0.1.0",
  name: "betting_pools",
  instructions: [
    {
      name: "initializePool",
      accounts: [
        { name: "pool", isMut: true, isSigner: true },
        { name: "authority", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "poolTokenAccount", isMut: true, isSigner: false },
        { name: "treasuryAccount", isMut: true, isSigner: false }
      ],
      args: [
        { name: "eventId", type: "string" },
        { name: "initialOddsHome", type: "u64" },
        { name: "initialOddsAway", type: "u64" },
        { name: "minBet", type: "u64" },
        { name: "maxBet", type: "u64" }
      ]
    },
    // ... other instructions will be added here
  ],
  accounts: [
    {
      name: "pool",
      type: {
        kind: "struct",
        fields: [
          { name: "eventId", type: "string" },
          { name: "totalHomeBets", type: "u64" },
          { name: "totalAwayBets", type: "u64" },
          { name: "oddsHome", type: "u64" },
          { name: "oddsAway", type: "u64" },
          { name: "minBet", type: "u64" },
          { name: "maxBet", type: "u64" },
          { name: "feePercentage", type: "u16" },
          { name: "isSettled", type: "bool" },
          { name: "authority", type: "publicKey" },
          { name: "winner", type: { option: "string" } },
          { name: "bets", type: { vec: { defined: "Bet" } } }
        ]
      }
    }
  ],
  types: [
    {
      name: "Bet",
      type: {
        kind: "struct",
        fields: [
          { name: "better", type: "publicKey" },
          { name: "amount", type: "u64" },
          { name: "team", type: "string" },
          { name: "odds", type: "u64" },
          { name: "timestamp", type: "i64" }
        ]
      }
    }
  ]
} as const;

export type BettingPools = typeof IDL; 