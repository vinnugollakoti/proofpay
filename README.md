# ProofPay

> **"AI can request a payment. A verified human decides whether it moves."**  
> *ETHOnline 2026 Hackathon Project*

ProofPay is a human-authorization payment and escrow system built across three primary technology pillars:
1. **World:** Biometric liveness check (World ID Selfie Check) to ensure physical human presence and prevent automated drain attacks.
2. **Privy:** User onboarding, organization wallet policy enforcement, and financial authorization keys.
3. **Arc:** Circle's Layer 1 blockchain (Chain ID `5042002`) for native USDC escrow custody and settlement.

---

## Architecture Overview

```
Client (ACME Studio)
   │
   ▼
Frontend (React + Vite + Tailwind)
   │
   ▼
Backend API (Node.js + Express + TypeScript + Prisma ORM)
   │
   ▼
Deterministic Risk Engine (Evaluates Amount ≥ 500 USDC, First-time Recipient, Velocity)
   │
   ▼ (If HIGH RISK)
World ID Selfie Check (Client completes biometric verification bound to payment signal)
   │
   ▼
Backend World Proof Verification (POST https://developer.world.org/api/v4/verify)
   │
   ▼
Privy Organization Policy Check (Max spend limits & destination whitelisting)
   │
   ▼
Arc Escrow Smart Contract (ProofPayEscrow.sol on Arc Testnet)
   │
   ▼
USDC Settlement ──▶ Freelancer Wallet
```

---

## Directory Structure

```
proofpay/
├── apps/
│   ├── api/             # Express.js + TypeScript Backend Service
│   │   ├── prisma/      # Prisma ORM Schema (schema.prisma)
│   │   ├── src/
│   │   │   ├── controllers/   # Auth, Jobs, Payments, Audit
│   │   │   ├── services/      # World, Privy, Arc, Risk Engine, Audit
│   │   │   ├── routes/        # REST Endpoints
│   │   │   ├── db/            # Prisma Client (prisma.ts) & Datastore
│   │   │   └── config.ts      # Loads root .env
│   └── web/             # React + Vite + Tailwind Frontend
│       ├── src/
│       │   ├── components/    # Navbar, SecurityBadge, AuditTimeline, WorldSelfieModal
│       │   ├── pages/         # ClientDashboard, FreelancerDashboard, JobDetails
│       │   └── services/      # API Client
│       └── vite.config.ts     # Configured to load root .env via envDir
├── contracts/           # Foundry Smart Contracts (Arc Testnet)
│   ├── src/
│   │   └── ProofPayEscrow.sol
│   ├── test/
│   │   └── ProofPayEscrow.t.sol
│   └── foundry.toml
├── docs/
│   └── architecture.md
├── .env.example         # Single Unified Master Environment Variables Template
└── package.json
```

---

## Quick Start

### 1. Environment Configuration
You only maintain **one** `.env` file at the root of `proofpay/`:
```bash
cp .env.example .env
```

The app starts in a self-contained demo mode by default. It uses seeded client and
freelancer accounts, records settlement as `PROTOCOL_RECORDED`, and labels the
simulated World check in the UI. To use real infrastructure, set
`PROOFPAY_DEMO_MODE=false`, then explicitly enable `PROOFPAY_USE_DATABASE=true`
and/or `PROOFPAY_ONCHAIN_SETTLEMENT=true` only after configuring and testing those
services. For Privy, set both `VITE_PRIVY_APP_ID` and the server-only
`PRIVY_VERIFICATION_KEY`; the API verifies each browser access token before it
creates a ProofPay session or allows a protected action.

### 2. Install Dependencies & Generate Prisma Client
```bash
pnpm install
cd apps/api && pnpm db:generate
```

### 3. Sync Database with Prisma ORM (When PostgreSQL is connected)
```bash
cd apps/api && pnpm db:push
```

### 4. Run Backend & Frontend
```bash
# Terminal 1: Backend API (Port 4000)
cd apps/api && pnpm dev

# Terminal 2: Frontend App (Port 5173)
cd apps/web && pnpm dev
```

### 5. Test Smart Contracts
```bash
cd contracts && forge test
```
