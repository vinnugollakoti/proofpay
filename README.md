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
Backend API (Node.js + Express + TypeScript)
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
│   │   ├── src/
│   │   │   ├── controllers/   # Auth, Jobs, Payments, Audit
│   │   │   ├── services/      # World, Privy, Arc, Risk Engine, Audit
│   │   │   ├── routes/        # REST Endpoints
│   │   │   ├── db/            # Schema & Seeded Datastore
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

### 1. Environment Configuration (Single Unified Key Set)
You only maintain **one** `.env` file at the root of `proofpay/`. Both the React frontend (Vite) and the Express backend read directly from this single file:
```bash
cp .env.example .env
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Run Backend & Frontend
```bash
# Terminal 1: Backend API (Port 4000)
cd apps/api && pnpm dev

# Terminal 2: Frontend App (Port 5173)
cd apps/web && pnpm dev
```

### 4. Test Smart Contracts
```bash
cd contracts && forge test
```
