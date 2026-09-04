import React from 'react';
import { ArrowRight, Eye, KeyRound, Landmark, CheckCircle2, ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';

interface LandingPageProps {
  onEnterClient: () => void;
  onEnterFreelancer: () => void;
  clientLoggedIn: boolean;
  freelancerLoggedIn: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterClient,
  onEnterFreelancer,
  clientLoggedIn,
  freelancerLoggedIn,
}) => {
  return (
    <div className="space-y-24 py-12">
      {/* Hero Section inspired by World.org */}
      <section className="text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-semibold">
          <span className="h-2 w-2 rounded-full bg-black"></span>
          Universal Proof of Human Payment Authorization Protocol
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-neutral-950 tracking-tight leading-[1.08]">
          "AI can request a payment.{' '}
          <span className="text-neutral-500 font-normal">
            A verified human decides whether it moves."
          </span>
        </h1>

        <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto font-normal leading-relaxed">
          ProofPay is a high-assurance financial authorization protocol. It introduces biometric proof-of-human
          and organizational policy controls for high-stakes Web3 disbursements.
        </p>

        {/* Separate Portal Entry Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
          <button
            onClick={onEnterClient}
            className="w-full sm:w-auto px-6 py-3.5 bg-black hover:bg-neutral-800 text-white font-medium rounded-full text-sm transition-all shadow-sm flex items-center justify-center gap-2 group"
          >
            <span>{clientLoggedIn ? 'Go to Client Escrows' : 'Sign In as Client (ACME)'}</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={onEnterFreelancer}
            className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-neutral-50 border border-neutral-300 hover:border-black text-neutral-900 font-medium rounded-full text-sm transition-all flex items-center justify-center gap-2"
          >
            <span>{freelancerLoggedIn ? 'Go to Freelancer Portal' : 'Sign In as Freelancer'}</span>
          </button>
        </div>

        {/* Minimalist Protocol Specs */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-900"></span>
            <strong>World ID:</strong> Biometric Selfie Check
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-900"></span>
            <strong>Privy:</strong> Wallet & Enclave Policy
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-900"></span>
            <strong>Settlement:</strong> Verified Protocol Disbursement
          </div>
        </div>
      </section>

      {/* The 3-Pillar Security Architecture in World.org Minimal White Style */}
      <section className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-neutral-950 tracking-tight">The Three-Pillar Security Architecture</h2>
          <p className="text-sm text-neutral-500 max-w-xl mx-auto">
            A defense-in-depth authorization pipeline ensuring funds only move when physical human presence,
            financial authorization, and smart contract custody are satisfied.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1: World */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-8 space-y-5 shadow-xs hover:border-neutral-400 transition-all">
            <div className="h-12 w-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-900">
              <Eye className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">Pillar 1 — World ID</span>
              <h3 className="text-xl font-bold text-neutral-950 mt-1">"Prove there is a human"</h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              When a payment exceeds risk thresholds, World ID Selfie Check verifies physical human liveness.
              The zero-knowledge proof is cryptographically bound to the job, recipient, and USDC amount.
            </p>
            <div className="pt-4 border-t border-neutral-100 space-y-2 text-xs text-neutral-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-black shrink-0" />
                <span>Zero-Knowledge liveness proof</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-black shrink-0" />
                <span>Single-use anti-replay nullifier cache</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-black shrink-0" />
                <span>60-second authorization TTL</span>
              </div>
            </div>
          </div>

          {/* Pillar 2: Privy */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-8 space-y-5 shadow-xs hover:border-neutral-400 transition-all">
            <div className="h-12 w-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-900">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">Pillar 2 — Privy</span>
              <h3 className="text-xl font-bold text-neutral-950 mt-1">"Prove it is authorized"</h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Privy powers frictionless embedded onboarding (social / email / passkey) and governs enterprise organization wallets. Enforces strict spending caps and destination address whitelists.
            </p>
            <div className="pt-4 border-t border-neutral-100 space-y-2 text-xs text-neutral-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-black shrink-0" />
                <span>Privy Embedded Wallets (seedless Arc L1)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-black shrink-0" />
                <span>Organization spending caps ($2,500 USDC)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-black shrink-0" />
                <a
                  href="https://dashboard.privy.io"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline text-black font-semibold flex items-center gap-1"
                >
                  Manage in Privy Dashboard ↗
                </a>
              </div>
            </div>
          </div>

          {/* Pillar 3: Settlement Protocol */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-8 space-y-5 shadow-xs hover:border-neutral-400 transition-all">
            <div className="h-12 w-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-900">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">Pillar 3 — Arc L1 Settlement</span>
              <h3 className="text-xl font-bold text-neutral-950 mt-1">"Move the money"</h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Funds are held in custody in ProofPayEscrow.sol and disbursed via Circle's native USDC precompile on Arc Testnet (5042002) with verifiable onchain receipts.
            </p>
            <div className="pt-4 border-t border-neutral-100 space-y-2 text-xs text-neutral-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-black shrink-0" />
                <a
                  href="https://testnet.arcscan.app/address/0x60cfC204D8D7A2a87483c08Be5127193545b4894"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline text-black font-semibold"
                >
                  Contract: 0x60cf...4894 ↗
                </a>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-black shrink-0" />
                <a
                  href="https://testnet.arcscan.app/address/0x37Da1f17986e4DC6d4E8D86713791698F07c8099"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline text-black font-semibold"
                >
                  Treasury: 0x37Da...8099 ↗
                </a>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-black shrink-0" />
                <span>Native USDC Precompile (0x3600...0000)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Dedicated Portals Card Sections */}
      <section className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-8 space-y-4 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-neutral-200 text-xs font-semibold text-neutral-900">
            Client Portal (Alice / ACME)
          </div>
          <h3 className="text-2xl font-bold text-neutral-950">Enterprise Escrow Management</h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Create milestone-based escrows, deposit USDC, review freelancer submissions, and trigger biometric World ID releases.
          </p>
          <button
            onClick={onEnterClient}
            className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-full transition-all flex items-center gap-1.5"
          >
            <span>{clientLoggedIn ? 'Open Client Dashboard' : 'Sign In as Client'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-8 space-y-4 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-neutral-200 text-xs font-semibold text-neutral-900">
            Freelancer Workspace (Bob)
          </div>
          <h3 className="text-2xl font-bold text-neutral-950">Milestone Deliveries & Payouts</h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Accept contracts with guaranteed escrow backing, submit GitHub or Figma work, and receive verified USDC payouts.
          </p>
          <button
            onClick={onEnterFreelancer}
            className="px-5 py-2.5 bg-white border border-neutral-300 hover:border-black text-neutral-950 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5"
          >
            <span>{freelancerLoggedIn ? 'Open Freelancer Dashboard' : 'Sign In as Freelancer'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      {/* Blocked Path Demo Callout */}
      <section className="max-w-4xl mx-auto bg-neutral-100 border border-neutral-300 rounded-3xl p-6 text-center space-y-2">
        <div className="inline-flex items-center gap-2 text-neutral-900 font-bold text-xs">
          <AlertTriangle className="h-4 w-4" />
          Hackathon Verification Failure Mode Testing
        </div>
        <p className="text-xs text-neutral-600 max-w-xl mx-auto leading-relaxed">
          In ProofPay, human verification is not cosmetic. In the demo, clicking{' '}
          <strong className="text-neutral-950">"Simulate Verification Failure"</strong> blocks the payment.
          Disbursement is immediately halted, and the escrowed USDC remains 100% protected.
        </p>
      </section>
    </div>
  );
};
