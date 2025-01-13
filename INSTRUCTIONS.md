# Deployment Instructions

## Prerequisites

1. Install Rust and Solana CLI tools:
```sh
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana
sh -c "$(curl -sSfL https://release.solana.com/v1.14.17/install)"
```

2. Install Anchor Framework:
```sh
# Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

3. Install Node.js dependencies:
```sh
npm install
```

## Configuration

1. Create a local Solana wallet:
```sh
solana-keygen new -o id.json
```

2. Configure Solana CLI:
```sh
solana config set --url devnet
solana config set --keypair ./id.json
```

3. Get some devnet SOL:
```sh
solana airdrop 2
```

## Smart Contract Deployment

1. Build the program:
```sh
anchor build
```

2. Get your program ID:
```sh
solana address -k target/deploy/betting_pools-keypair.json
```

3. Update program ID in:
- `programs/betting-pools/src/lib.rs`
- `Anchor.toml`
- `.env`

4. Deploy to devnet:
```sh
anchor deploy --provider.cluster devnet
```

## Frontend Setup

1. Create `.env` file:
```sh
VITE_ODDS_API_KEY=your_api_key_here
VITE_PROGRAM_ID=your_program_id
VITE_TREASURY_ACCOUNT=your_treasury_wallet
VITE_TOKEN_MINT=your_token_mint_address
```

2. Start development server:
```sh
npm run dev
```

## Testing

1. Run smart contract tests:
```sh
anchor test
```

2. Run frontend tests:
```sh
npm test
```

## Monitoring

1. Monitor program logs:
```sh
solana logs -u devnet your_program_id
```

2. Monitor oracle updates:
```sh
npm run monitor-oracle
```

## Maintenance

1. Update program:
```sh
anchor upgrade program_id --program-id program_id
```

2. Emergency stop (if authorized):
```sh
anchor run emergency-stop
```

## Security Considerations

- Keep deployment keys secure
- Monitor oracle data quality
- Set up alerts for large positions
- Regular backups of program state
- Monitor gas prices and adjust accordingly

## Troubleshooting

Common issues and solutions:

1. RPC Node errors:
   - Try different RPC endpoints
   - Check node status

2. Transaction failures:
   - Check account balances
   - Verify permissions
   - Check program logs

3. Oracle issues:
   - Verify API keys
   - Check rate limits
   - Monitor data quality

## Production Deployment

Additional steps for mainnet:

1. Security audit
2. Load testing
3. Backup infrastructure
4. Monitoring setup
5. Emergency procedures
