import React from 'react';
import { ShieldCheck, Eye, KeyRound, CheckCircle2 } from 'lucide-react';

interface SecurityBadgeProps {
  requiresHumanVerification: boolean;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({
  requiresHumanVerification,
  riskLevel = 'HIGH',
}) => {
  return (
    <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-neutral-950 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-black" />
          Triple-Verification Security Layer
        </span>
        <span
          className={`text-xs px-3 py-1 rounded-full font-semibold border font-mono ${
            riskLevel === 'HIGH'
              ? 'bg-neutral-100 text-neutral-900 border-neutral-300'
              : 'bg-neutral-50 text-neutral-600 border-neutral-200'
          }`}
        >
          {riskLevel} RISK
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* World Pillar */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            requiresHumanVerification
              ? 'bg-neutral-50 border-neutral-300 text-neutral-950'
              : 'bg-neutral-50/50 border-neutral-200 text-neutral-500'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold mb-1">
            <Eye className="h-3.5 w-3.5 text-black" />
            <span>World Selfie Check</span>
          </div>
          <p className="text-[11px] text-neutral-500 leading-relaxed">
            {requiresHumanVerification
              ? 'Mandatory: Biometric liveness check required (≥$500)'
              : 'Optional: Standard limit'}
          </p>
        </div>

        {/* Privy Pillar */}
        <div className="p-4 rounded-2xl border bg-neutral-50 border-neutral-300 text-neutral-950">
          <div className="flex items-center gap-1.5 font-bold mb-1">
            <KeyRound className="h-3.5 w-3.5 text-black" />
            <span>Privy Wallet Policy</span>
          </div>
          <p className="text-[11px] text-neutral-500 leading-relaxed">
            $5,000 org cap & destination address whitelisting enforced
          </p>
        </div>

        {/* Settlement Pillar */}
        <div className="p-4 rounded-2xl border bg-neutral-50 border-neutral-300 text-neutral-950">
          <div className="flex items-center gap-1.5 font-bold mb-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-black" />
            <span>Protocol Settlement</span>
          </div>
          <p className="text-[11px] text-neutral-500 leading-relaxed">
            Immutable settlement record & instant disbursement
          </p>
        </div>
      </div>
    </div>
  );
};
