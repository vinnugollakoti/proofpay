import React from 'react';
import { ShieldCheck, Eye, KeyRound, Landmark } from 'lucide-react';

interface SecurityBadgeProps {
  requiresHumanVerification: boolean;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({
  requiresHumanVerification,
  riskLevel = 'HIGH',
}) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Triple-Verification Security Layer
        </span>
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
            riskLevel === 'HIGH'
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
          }`}
        >
          {riskLevel} RISK
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        {/* World Pillar */}
        <div
          className={`p-2.5 rounded-lg border transition-all ${
            requiresHumanVerification
              ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-200'
              : 'bg-slate-800/40 border-slate-700/50 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-1.5 font-medium mb-1">
            <Eye className="h-3.5 w-3.5 text-cyan-400" />
            <span>World Selfie Check</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {requiresHumanVerification
              ? 'Mandatory: Biometric liveness check required'
              : 'Optional: Standard limit'}
          </p>
        </div>

        {/* Privy Pillar */}
        <div className="p-2.5 rounded-lg border bg-indigo-950/30 border-indigo-500/40 text-indigo-200">
          <div className="flex items-center gap-1.5 font-medium mb-1">
            <KeyRound className="h-3.5 w-3.5 text-indigo-400" />
            <span>Privy Wallet Policy</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Org spending limit & destination whitelisting enforced
          </p>
        </div>

        {/* Arc Pillar */}
        <div className="p-2.5 rounded-lg border bg-blue-950/30 border-blue-500/40 text-blue-200">
          <div className="flex items-center gap-1.5 font-medium mb-1">
            <Landmark className="h-3.5 w-3.5 text-blue-400" />
            <span>Arc Escrow (L1)</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Solidity contract custody in native Arc USDC
          </p>
        </div>
      </div>
    </div>
  );
};
