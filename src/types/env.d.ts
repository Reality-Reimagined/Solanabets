/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PROGRAM_ID: string;
  readonly VITE_TREASURY_ACCOUNT: string;
  readonly VITE_TOKEN_MINT: string;
  readonly VITE_ODDS_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 