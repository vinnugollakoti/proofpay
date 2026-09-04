import React from 'react';
import { ShieldCheck, UserCheck, Wallet, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentRole: 'CLIENT' | 'FREELANCER';
  onToggleRole: (role: 'CLIENT' | 'FREELANCER') => void;
  onOpenCreateJob: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onToggleRole,
  onOpenCreateJob,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-white">ProofPay</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-medium border border-emerald-500/30">
                Arc L1
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Human-Authorization Layer for Web3 Settlement
            </p>
          </div>
        </div>

        {/* Integration Pillars Badges */}
        <div className="hidden md:flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
            World <span className="text-slate-500">(Human Proof)</span>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
            Privy <span className="text-slate-500">(Policy Auth)</span>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
            Arc <span className="text-slate-500">(USDC Settlement)</span>
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {/* Role Switcher */}
          <div className="bg-slate-800 p-1 rounded-lg border border-slate-700 flex text-xs font-medium">
            <button
              onClick={() => onToggleRole('CLIENT')}
              className={`px-3 py-1 rounded-md transition-all ${
                currentRole === 'CLIENT'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Client (ACME)
            </button>
            <button
              onClick={() => onToggleRole('FREELANCER')}
              className={`px-3 py-1 rounded-md transition-all ${
                currentRole === 'FREELANCER'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Freelancer
            </button>
          </div>

          {currentRole === 'CLIENT' && (
            <button
              onClick={onOpenCreateJob}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              New Escrow Job
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
