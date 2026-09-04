import React from 'react';
import ReactDOM from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth';
import { App } from './App';
import './index.css';

const privyAppId = import.meta.env.VITE_PRIVY_APP_ID || 'cmtn2ziaa00cb0cjptl32yhx0';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ['email', 'wallet', 'google'],
        appearance: {
          theme: 'light',
          accentColor: '#000000',
          showWalletLoginFirst: true,
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        defaultChain: {
          id: 5042002,
          name: 'Arc Testnet',
          network: 'arc-testnet',
          nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
          rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
          blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' } },
        },
        supportedChains: [
          {
            id: 5042002,
            name: 'Arc Testnet',
            network: 'arc-testnet',
            nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
            rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
            blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' } },
          },
        ],
      }}
    >
      <App />
    </PrivyProvider>
  </React.StrictMode>
);
