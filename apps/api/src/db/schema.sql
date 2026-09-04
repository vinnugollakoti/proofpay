-- ProofPay Database Schema
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    privy_org_id VARCHAR(255),
    wallet_address VARCHAR(42) NOT NULL,
    max_release_limit_usdc NUMERIC(18, 6) DEFAULT 5000,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    privy_user_id VARCHAR(255) NOT NULL,
    wallet_address VARCHAR(42) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'CLIENT',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    client_id UUID NOT NULL REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    freelancer_id UUID REFERENCES users(id),
    freelancer_payout_address VARCHAR(42) NOT NULL,
    amount_usdc NUMERIC(18, 6) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED',
    escrow_id VARCHAR(66),
    submission_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_intents (
    id UUID PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES jobs(id),
    client_id UUID NOT NULL REFERENCES users(id),
    recipient_address VARCHAR(42) NOT NULL,
    amount_usdc NUMERIC(18, 6) NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    requires_human_verification BOOLEAN NOT NULL DEFAULT FALSE,
    signal_hash VARCHAR(66) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verifications (
    id UUID PRIMARY KEY,
    payment_intent_id UUID NOT NULL REFERENCES payment_intents(id),
    nullifier_hash VARCHAR(255) NOT NULL,
    merkle_root VARCHAR(255) NOT NULL,
    verification_level VARCHAR(50) NOT NULL,
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY,
    job_id UUID NOT NULL,
    payment_intent_id UUID,
    event_type VARCHAR(100) NOT NULL,
    actor_address VARCHAR(42),
    actor_role VARCHAR(50),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
