# ProofPay — System Architecture Specification
**ETHOnline 2026 Hackathon Project**
*Tagline:* "AI can request a payment. A verified human decides whether it moves." *(Initial implementation: Human-authorization payment layer via a freelance marketplace without AI).*

---

## 1. Executive Summary & Core Thesis

ProofPay introduces a multi-layer financial authorization paradigm for high-stakes Web3 payments:
- **World:** Proves a living, verified human is authorizing the transaction (via World ID Selfie Check / liveness).
- **Privy:** Proves the client's financial entity / organization wallet policy permits the transfer.
- **Arc:** Provides native USDC escrow settlement on EVM Layer 1 with zero cross-chain fragmentation.

### Why Each Partner Exists
1. **World:** Prevents automated drain, stolen credentials, deepfakes, and rogue bot executions. A user clicking "Approve" on a high-risk payout must prove physical human presence bound cryptographically to the exact payment parameters.
2. **Privy:** Manages enterprise-grade user onboarding, embedded wallets, organization hierarchy (Admin / Finance Manager), server authorization keys (P-256 signatures), and enforceable wallet policies (spending limits, destination contract whitelisting).
3. **Arc:** The single settlement blockchain. Arc natively integrates USDC as its gas and settlement asset (Chain ID `5042002`). Funds sit in a verifiable Solidity escrow contract until release conditions are satisfied.

---

## 2. Technical Verifications & Reality Check

| Partner / Component | Verified Current Reality (Docs / Testnet) | Architectural Decision in ProofPay |
|---|---|---|
| **Arc Testnet** | Chain ID: `5042002`. RPC: `https://rpc.testnet.arc.network`. USDC is the native gas token (18 decimals protocol level). Also provides an ERC-20 system interface at `0x3600000000000000000000000000000000000000` (6 decimals). | `ProofPayEscrow.sol` will interact with the canonical ERC-20 interface (`0x3600...`) or allow configurable ERC20 token address for seamless testing across Anvil and Arc Testnet. |
| **World ID & Selfie Check** | Official verification API: `POST https://developer.world.org/api/v4/verify/{app_id}`. Client uses `@worldcoin/idkit`. Returns credential verification identifier `"selfie"`. Cannot be verified directly inside Arc smart contract onchain. | Proof verification happens **exclusively on the backend** against World's developer API. The proof is cryptographically bound to `signal = hash(jobId, intentId, recipient, amount)`. |
| **Privy Wallets & Policies** | Privy server wallets and organization wallets use P-256 Authorization Keys with signed headers (`privy-authorization-signature`). Policies enforce max spend limits and contract address whitelists in Privy's secure enclave. | The backend evaluates Privy organization policies and executes wallet operations using Privy Server SDK and Authorization Key signatures. Frontend never touches server secrets. |
| **Cross-Chain / AI Scope** | Single chain (Arc). No bridges. No layerZero/Chainlink CCIP. No LLM agents in MVP. | Strictly 1 chain (Arc Testnet), deterministic risk engine, pure human authorization pipeline. |

---

## 3. Architecture Diagrams

### A. Final System Architecture
```mermaid
flowchart TD
    subgraph ClientLayer ["Frontend (React + Vite + Tailwind + Privy SDK + IDKit)"]
        UI["Web App (Client / Freelancer Dashboards)"]
        IDKitModal["World IDKit Modal (Selfie Check)"]
        PrivyAuth["Privy Auth & Embedded Wallet"]
    end

    subgraph BackendLayer ["Backend (Node.js + TypeScript + Fastify/Express)"]
        AuthSvc["Auth & Session Manager"]
        JobSvc["Job & Escrow Coordinator"]
        RiskEngine["Deterministic Risk Engine"]
        WorldVerifier["World Proof Verification Service"]
        PrivySvc["Privy Org & Policy Enforcement Service"]
        ArcRelayer["Arc Onchain Transaction Relayer / Signer"]
        AuditLog["Audit Trail & Event Logger"]
    end

    subgraph DataLayer ["Persistence (PostgreSQL)"]
        DB[(PostgreSQL Database)]
    end

    subgraph PartnerLayer ["External Services & Blockchain"]
        WorldAPI["World Developer API (v4 Verify)"]
        PrivyAPI["Privy Enclave & Policy Engine"]
        ArcChain["Arc Testnet (Chain ID: 5042002)"]
        EscrowContract["ProofPayEscrow.sol (Arc)"]
    end

    UI -->|Session / Actions| AuthSvc
    UI -->|Open Selfie Check| IDKitModal
    IDKitModal -->|Selfie Proof| UI
    UI -->|Submit Proof + Release Request| JobSvc
    JobSvc --> RiskEngine
    JobSvc --> WorldVerifier
    WorldVerifier -->|POST /api/v4/verify| WorldAPI
    JobSvc --> PrivySvc
    PrivySvc -->|Policy Evaluation / Signing| PrivyAPI
    JobSvc --> ArcRelayer
    ArcRelayer -->|releaseEscrow() Transaction| EscrowContract
    EscrowContract -->|Transfer USDC| ArcChain
    JobSvc --> AuditLog
    AuditLog --> DB
    JobSvc --> DB
```

---

### B. Sequence Diagrams

#### 1. Fund Escrow Flow
```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant FE as Frontend
    participant BE as Backend
    participant Privy as Privy Wallet
    participant Arc as Arc Escrow Contract

    Client->>FE: Click "Fund Escrow" (e.g. 500 USDC)
    FE->>BE: POST /api/jobs/:id/fund-intent
    BE-->>FE: Intent Created (Escrow Address, Amount, Calldata)
    FE->>Privy: Request Client Wallet Signature (Approve + Fund)
    Privy->>Arc: approve(escrowContract, 500 USDC)
    Privy->>Arc: fundEscrow(jobId, 500 USDC)
    Arc-->>FE: Tx Hash Confirmed
    FE->>BE: POST /api/jobs/:id/confirm-fund (txHash)
    BE->>Arc: Verify Onchain Event (EscrowFunded)
    BE->>BE: Update Job State: FUNDED
    BE-->>FE: Success + Audit Trail Updated
```

#### 2. Release Payment Success Flow (High-Risk Path)
```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant FE as Frontend
    participant BE as Backend
    participant Risk as Deterministic Risk Engine
    participant World as World IDKit / API
    participant Privy as Privy Policy Engine
    participant Arc as Arc Escrow Contract
    actor Freelancer

    Client->>FE: Click "Release Payment"
    FE->>BE: POST /api/payments/release-intent
    BE->>Risk: Evaluate Risk (Amount >= Threshold OR New Recipient)
    Risk-->>BE: Decision: HIGH_RISK (requiresHumanVerification: true)
    BE-->>FE: Return { intentId, requiresHumanVerification: true, signalHash }
    
    FE->>World: Trigger IDKit Selfie Check (signal: signalHash)
    World-->>FE: Return World Proof (merkle_root, nullifier_hash, proof, credential_type)
    
    FE->>BE: POST /api/payments/verify-and-release { intentId, worldProof }
    BE->>World: POST https://developer.world.org/api/v4/verify (rp_id, proof, signal)
    World-->>BE: Verification Success (200 OK, valid: true)
    BE->>BE: Validate Nullifier Not Replayed & Intent TTL < 60s
    
    BE->>Privy: Check Organization Policy & Authorization
    Privy-->>BE: Policy Passed (Authorized)
    
    BE->>Arc: Submit releaseEscrow(jobId, recipient, amount, nonce)
    Arc-->>BE: Tx Hash (USDC transferred to Freelancer)
    BE->>BE: Record Audit Event + Mark Payment RELEASED
    BE-->>FE: Success { txHash, status: "RELEASED" }
    FE-->>Client: Show Release Success & Explorer Link
    FE-->>Freelancer: Funds Received in Wallet
```

#### 3. Release Payment Failure / Blocked Flow
```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant FE as Frontend
    participant BE as Backend
    participant World as World IDKit / API
    participant Arc as Arc Escrow Contract

    Client->>FE: Click "Release Payment"
    FE->>BE: POST /api/payments/release-intent
    BE-->>FE: HIGH_RISK -> Requires Selfie Check
    FE->>World: Trigger IDKit Selfie Check
    World-->>FE: Verification Cancelled / Tampered Proof
    FE->>BE: POST /api/payments/verify-and-release { intentId, worldProof }
    BE->>World: Verify Proof
    World-->>BE: 400 Invalid Proof / Liveness Failure
    BE->>BE: Block Intent + Record Audit Event (VERIFICATION_FAILED)
    BE-->>FE: 403 Payment Blocked: Human Verification Failed
    Note over Arc: No transaction ever sent to Arc!<br/>USDC remains completely locked in Escrow.
    FE-->>Client: Error Banner: "Payment Blocked. Funds remain safe in Escrow."
```

---

## 4. Responsibility Matrix

| Responsibility | World | Privy | Arc | Backend | Smart Contract | Frontend | Database |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| User Authentication & Wallets | | ✅ | | | | ✅ | |
| Organization & Multi-User Roles | | ✅ | | | | | ✅ |
| Human Liveness / Biometrics Check | ✅ | | | | | ✅ (Modal) | |
| Proof Verification | | | | ✅ | | | |
| Wallet Policy & Spending Guardrails | | ✅ | | ✅ | | | |
| Deterministic Risk Evaluation | | | | ✅ | | | |
| Holding Escrowed USDC | | | ✅ | | ✅ | | |
| Enforcing State Transitions (Onchain)| | | ✅ | | ✅ | | |
| Relaying Authorized Transactions | | ✅ / Server | ✅ | ✅ | | | |
| Audit Trail & State Storage | | | | ✅ | | | ✅ |
| Visual Security Indicators & UI | | | | | | ✅ | |

---

## 5. Database Schema (PostgreSQL / Supabase)

```sql
-- Core Organizations & Users
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    privy_org_id VARCHAR(255) UNIQUE,
    wallet_address VARCHAR(42) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    privy_user_id VARCHAR(255) UNIQUE NOT NULL,
    wallet_address VARCHAR(42) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'CLIENT', -- CLIENT, FREELANCER, ORG_ADMIN
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs and Milestones
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    client_id UUID NOT NULL REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    freelancer_id UUID REFERENCES users(id),
    freelancer_payout_address VARCHAR(42) NOT NULL,
    amount_usdc NUMERIC(18, 6) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED', -- CREATED, ACCEPTED, FUNDED, WORK_SUBMITTED, APPROVED, COMPLETED, REFUNDED
    escrow_id VARCHAR(66), -- onchain bytes32 escrow ID
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Intents & Risk Assessment
CREATE TABLE payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id),
    client_id UUID NOT NULL REFERENCES users(id),
    recipient_address VARCHAR(42) NOT NULL,
    amount_usdc NUMERIC(18, 6) NOT NULL,
    risk_level VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH
    requires_human_verification BOOLEAN NOT NULL DEFAULT FALSE,
    signal_hash VARCHAR(66) NOT NULL, -- cryptographic binding hash
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, VERIFIED, EXECUTED, BLOCKED, EXPIRED
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Human Verifications (World ID)
CREATE TABLE verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_intent_id UUID NOT NULL REFERENCES payment_intents(id),
    nullifier_hash VARCHAR(255) NOT NULL,
    merkle_root VARCHAR(255) NOT NULL,
    verification_level VARCHAR(50) NOT NULL, -- 'selfie', 'orb', 'device'
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) NOT NULL, -- VALID, REPLAY_DETECTED, EXPIRED, FAILED
    CONSTRAINT uq_payment_nullifier UNIQUE(payment_intent_id, nullifier_hash)
);

-- Onchain Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id),
    payment_intent_id UUID REFERENCES payment_intents(id),
    tx_hash VARCHAR(66) UNIQUE,
    chain_id INT NOT NULL DEFAULT 5042002, -- Arc Testnet
    action VARCHAR(50) NOT NULL, -- FUND, RELEASE, REFUND
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, CONFIRMED, FAILED
    block_number BIGINT,
    gas_used NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Trail
CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id),
    payment_intent_id UUID REFERENCES payment_intents(id),
    event_type VARCHAR(100) NOT NULL,
    actor_id UUID REFERENCES users(id),
    actor_role VARCHAR(50),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. Smart Contract Architecture (`ProofPayEscrow.sol`)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ProofPayEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdcToken;

    enum EscrowStatus { NONE, FUNDED, RELEASED, REFUNDED }

    struct Escrow {
        bytes32 escrowId;
        address client;
        address freelancer;
        uint256 amount;
        EscrowStatus status;
        uint256 fundedAt;
    }

    mapping(bytes32 => Escrow) public escrows;
    address public relayer;

    event EscrowFunded(bytes32 indexed escrowId, address indexed client, address indexed freelancer, uint256 amount);
    event EscrowReleased(bytes32 indexed escrowId, address indexed recipient, uint256 amount, bytes32 authorizationHash);
    event EscrowRefunded(bytes32 indexed escrowId, address indexed client, uint256 amount);

    constructor(address _usdcToken, address _relayer) Ownable(msg.sender) {
        usdcToken = IERC20(_usdcToken);
        relayer = _relayer;
    }

    function setRelayer(address _newRelayer) external onlyOwner {
        require(_newRelayer != address(0), "Invalid relayer");
        relayer = _newRelayer;
    }

    function fundEscrow(bytes32 escrowId, address freelancer, uint256 amount) external nonReentrant {
        require(escrows[escrowId].status == EscrowStatus.NONE, "Escrow already exists");
        require(freelancer != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");

        escrows[escrowId] = Escrow({
            escrowId: escrowId,
            client: msg.sender,
            freelancer: freelancer,
            amount: amount,
            status: EscrowStatus.FUNDED,
            fundedAt: block.timestamp
        });

        usdcToken.safeTransferFrom(msg.sender, address(this), amount);
        emit EscrowFunded(escrowId, msg.sender, freelancer, amount);
    }

    function releaseEscrow(
        bytes32 escrowId,
        address recipient,
        uint256 amount,
        bytes32 authorizationHash
    ) external nonReentrant {
        require(msg.sender == relayer || msg.sender == escrows[escrowId].client, "Unauthorized caller");
        Escrow storage item = escrows[escrowId];
        require(item.status == EscrowStatus.FUNDED, "Escrow not in FUNDED state");
        require(recipient == item.freelancer, "Recipient mismatch");
        require(amount == item.amount, "Amount mismatch");

        item.status = EscrowStatus.RELEASED;
        usdcToken.safeTransfer(recipient, amount);

        emit EscrowReleased(escrowId, recipient, amount, authorizationHash);
    }

    function refundEscrow(bytes32 escrowId) external nonReentrant {
        Escrow storage item = escrows[escrowId];
        require(item.status == EscrowStatus.FUNDED, "Escrow not FUNDED");
        require(msg.sender == item.client || msg.sender == owner(), "Unauthorized");

        item.status = EscrowStatus.REFUNDED;
        usdcToken.safeTransfer(item.client, item.amount);

        emit EscrowRefunded(escrowId, item.client, item.amount);
    }
}
```

---

## 7. Deterministic Risk Engine Specification

```typescript
export interface RiskEvaluationInput {
  amountUsdc: number;
  isFirstPaymentToRecipient: boolean;
  payoutRecipientChanged: boolean;
  historicalVelocityPerHour: number;
}

export interface RiskDecision {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  requiresHumanVerification: boolean;
  reasons: string[];
}

export class DeterministicRiskEngine {
  private static HIGH_AMOUNT_THRESHOLD = 500; // >= $500 triggers verification
  private static VELOCITY_THRESHOLD = 3;       // > 3 payments/hr triggers verification

  static evaluate(input: RiskEvaluationInput): RiskDecision {
    const reasons: string[] = [];
    let isHighRisk = false;

    if (input.payoutRecipientChanged) {
      isHighRisk = true;
      reasons.push("Payout destination address changed from initial contract");
    }

    if (input.amountUsdc >= this.HIGH_AMOUNT_THRESHOLD) {
      isHighRisk = true;
      reasons.push(`Amount ($${input.amountUsdc} USDC) exceeds threshold ($${this.HIGH_AMOUNT_THRESHOLD} USDC)`);
    }

    if (input.isFirstPaymentToRecipient) {
      isHighRisk = true;
      reasons.push("First payment interaction with this freelancer recipient");
    }

    if (input.historicalVelocityPerHour > this.VELOCITY_THRESHOLD) {
      isHighRisk = true;
      reasons.push("Unusual payment release velocity detected");
    }

    if (isHighRisk) {
      return { riskLevel: 'HIGH', requiresHumanVerification: true, reasons };
    }

    return { riskLevel: 'LOW', requiresHumanVerification: false, reasons: ["Standard low-risk threshold"] };
  }
}
```

---

## 8. Cryptographic Binding & Anti-Replay Model

1. **Signal Computation:**
   $$\text{signal} = \text{keccak256}(\text{abi.encodePacked}(\text{jobId}, \text{intentId}, \text{recipientAddress}, \text{amountUSDC}))$$
2. The frontend passes this exact `signal` into World IDKit.
3. IDKit zero-knowledge proof verifies over this signal.
4. Backend sends the proof and signal to `https://developer.world.org/api/v4/verify/{app_id}`.
5. If verified, backend checks `verifications` table:
   - If `nullifier_hash` exists for any past payment or this intent, reject replay.
   - Store `(payment_intent_id, nullifier_hash)`.
   - Authorization is valid for only **60 seconds (TTL)**.
   - If recipient is modified in database or payload, `signal` changes, invalidating any previous verification.

---

## 9. State Machines

### 1. Job State Machine
`CREATED` $\rightarrow$ `ACCEPTED` $\rightarrow$ `FUNDED` $\rightarrow$ `WORK_SUBMITTED` $\rightarrow$ `APPROVED` $\rightarrow$ `COMPLETED` *(or `REFUNDED` from `FUNDED`)*.

### 2. Escrow State Machine (Smart Contract)
`NONE` $\rightarrow$ `FUNDED` $\rightarrow$ `RELEASED` *(or `REFUNDED`)*.

### 3. Payment Intent State Machine
`PENDING` $\rightarrow$ `VERIFIED` $\rightarrow$ `EXECUTED` *(terminal)*  
`PENDING` $\rightarrow$ `BLOCKED` *(on verification failure)*  
`PENDING` $\rightarrow$ `EXPIRED` *(after 60s TTL)*

---

## 10. REST API Specification

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/auth/session` | Exchanges Privy token for authenticated user session | Privy JWT |
| `GET` | `/api/jobs` | Lists all jobs for user/org | Session |
| `POST` | `/api/jobs` | Creates a freelance job | Client |
| `POST` | `/api/jobs/:id/accept` | Freelancer accepts job & sets payout address | Freelancer |
| `POST` | `/api/jobs/:id/fund-intent` | Prepares escrow funding parameters | Client |
| `POST` | `/api/jobs/:id/confirm-fund` | Validates onchain deposit transaction | Client |
| `POST` | `/api/jobs/:id/submit-work` | Submits deliverable link/summary | Freelancer |
| `POST` | `/api/jobs/:id/approve` | Client approves completed work | Client |
| `POST` | `/api/payments/release-intent`| Runs Risk Engine, creates payment intent & signal hash | Client |
| `POST` | `/api/payments/verify-and-release` | Verifies World proof + Privy policy + submits Arc release | Client |
| `GET` | `/api/audit/:jobId` | Returns timeline of audit events & proofs | Public/User |

---

## 11. Environment Variable Specification

### Backend (`.env`)
```env
# Server
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/proofpay

# World ID
WORLD_APP_ID=app_staging_xxx
WORLD_ACTION=release-payment
WORLD_VERIFY_URL=https://developer.world.org/api/v4/verify

# Privy
PRIVY_APP_ID=clxxx
PRIVY_APP_SECRET=xxx
PRIVY_VERIFICATION_KEY=xxx
PRIVY_AUTHORIZATION_KEY_P256=xxx

# Arc Testnet
ARC_CHAIN_ID=5042002
ARC_RPC_URL=https://rpc.testnet.arc.network
ARC_ESCROW_CONTRACT_ADDRESS=0x...
ARC_USDC_CONTRACT_ADDRESS=0x3600000000000000000000000000000000000000
ARC_RELAYER_PRIVATE_KEY=0x...
```

### Frontend (`.env`)
```env
VITE_PRIVY_APP_ID=clxxx
VITE_WORLD_APP_ID=app_staging_xxx
VITE_WORLD_ACTION=release-payment
VITE_API_URL=http://localhost:4000
VITE_ARC_CHAIN_ID=5042002
VITE_ARC_RPC_URL=https://rpc.testnet.arc.network
VITE_ARC_EXPLORER_URL=https://testnet.arcscan.app
```

---

## 12. Monorepo Project Structure

```
proofpay/
├── apps/
│   ├── api/                     # Node.js + TypeScript backend
│   └── web/                     # React + Vite + Tailwind + Privy + IDKit
├── contracts/                   # Foundry smart contracts
│   ├── src/ProofPayEscrow.sol
│   ├── test/ProofPayEscrow.t.sol
│   └── script/DeployEscrow.s.sol
├── docs/
│   └── architecture.md
├── package.json
└── README.md
```

---

## 13. Implementation Phases

- **Phase 0:** Architecture & Documentation alignment (Done).
- **Phase 1 (Arc + Smart Contract):** Deploy and test `ProofPayEscrow.sol` with Foundry on Arc Testnet; verify USDC deposit and release.
- **Phase 2 (Privy Integration):** Setup Privy React Auth, embedded client wallet, server authorization key signing and policy verification.
- **Phase 3 (World IDKit & Backend Verifier):** Integrate World IDKit modal with Selfie Check credential, bind cryptographic signal hash, implement backend `v4/verify` call and anti-replay nullifier cache.
- **Phase 4 (Risk Engine & End-to-End Orchestrator):** Connect Risk Engine -> World -> Privy -> Arc Escrow release.
- **Phase 5 (Database & Audit Trail):** Store all state transitions, hashes, and timeline entries.
- **Phase 6 (Frontend UI):** Build clean Client/Freelancer workflow screens with clear 3-layer security indicator (World / Privy / Arc).
- **Phase 7 (Failure Demo & Verification):** Test failed verification blocking funds from moving.
