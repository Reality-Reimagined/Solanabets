import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createAppKit } from '@reown/appkit/react';
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react';
import { solana, solanaTestnet, solanaDevnet } from '@reown/appkit/networks';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { Landing } from './pages/Landing';
import { Platform } from './pages/Platform';

// Set up Solana Adapter
const solanaWeb3JsAdapter = new SolanaAdapter({
  wallets: [new PhantomWalletAdapter(), new SolflareWalletAdapter()]
});

// Create AppKit instance
createAppKit({
  projectId: import.meta.env.VITE_PROGRAM_ID,
  metadata: {
    name: 'SolanaBets',
    description: 'Decentralized Sports Prediction Platform',
    url: window.location.origin,
    icons: ['https://avatars.githubusercontent.com/u/37784886']
  },
  adapters: [solanaWeb3JsAdapter],
  networks: [solana, solanaTestnet, solanaDevnet],
  features: {
    analytics: true
  }
});

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<Platform />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;