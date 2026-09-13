import dotenv from 'dotenv';
import path from 'path';

// Load root proofpay/.env first, then local fallback
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  demoMode: process.env.PROOFPAY_DEMO_MODE !== 'false',

  // Database (Supabase PostgreSQL / Prisma)
  databaseUrl: process.env.DATABASE_URL || '',
  directUrl: process.env.DIRECT_URL || process.env.DATABASE_URL || '',
  // The demo is intentionally self-contained. Opt into a live Supabase database
  // only after its connection string has been verified.
  databaseEnabled: process.env.PROOFPAY_USE_DATABASE === 'true',

  // Supabase Client SDK
  supabase: {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  jwtSecret: process.env.JWT_SECRET || 'proofpay_default_jwt_secret',

  world: {
    appId: process.env.VITE_WORLD_APP_ID || process.env.WORLD_APP_ID || 'app_staging_proofpay_demo',
    rpId: process.env.WORLD_RIP_ID || process.env.WORLD_RP_ID || '',
    signerAddress: process.env.WORLD_SIGNER_ADDRESS || '',
    key: process.env.WORLD_KEY || '',
    action: process.env.VITE_WORLD_ACTION || process.env.WORLD_ACTION || 'release-payment',
    verifyUrl: process.env.WORLD_VERIFY_URL || 'https://developer.world.org/api/v4/verify',
    mockVerification: process.env.WORLD_MOCK_VERIFICATION === 'true',
  },

  privy: {
    appId: process.env.VITE_PRIVY_APP_ID || process.env.PRIVY_APP_ID || '',
    appSecret: process.env.PRIVY_APP_SECRET || '',
    verificationKey: process.env.PRIVY_VERIFICATION_KEY || '',
    authKeyP256: process.env.PRIVY_AUTHORIZATION_KEY_P256 || '',
    orgId: process.env.PRIVY_ORG_ID || 'org_acme_design',
  },

  arc: {
    chainId: parseInt(process.env.VITE_ARC_CHAIN_ID || process.env.ARC_CHAIN_ID || '5042002', 10),
    rpcUrl: process.env.VITE_ARC_RPC_URL || process.env.ARC_RPC_URL || 'https://rpc.testnet.arc.network',
    explorerUrl: process.env.VITE_ARC_EXPLORER_URL || process.env.ARC_EXPLORER_URL || 'https://testnet.arcscan.app',
    usdcAddress: process.env.VITE_ARC_USDC_CONTRACT_ADDRESS || process.env.ARC_USDC_CONTRACT_ADDRESS || '0x3600000000000000000000000000000000000000',
    escrowAddress: process.env.VITE_ARC_ESCROW_CONTRACT_ADDRESS || process.env.ARC_ESCROW_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
    relayerPrivateKey: process.env.ARC_RELAYER_PRIVATE_KEY || '',
    executeOnchain: process.env.PROOFPAY_ONCHAIN_SETTLEMENT === 'true',
  },
};
