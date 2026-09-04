import React from 'react';
import { ShieldCheck, LogOut, ArrowRight, UserCheck, Plus, ExternalLink, KeyRound } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { ArcAddress } from './ArcAddress';

interface NavbarProps {
  currentUser: any | null;
  currentOrg: any | null;
  currentRole: 'CLIENT' | 'FREELANCER';
  currentView: 'LANDING' | 'WORKSPACE';
  onGoHome: () => void;
  onGoWorkspace: (role?: 'CLIENT' | 'FREELANCER') => void;
  onOpenLogin: (role: 'CLIENT' | 'FREELANCER') => void;
  onLogout: () => void;
  onOpenCreateJob: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentOrg,
  currentRole,
  currentView,
  onGoHome,
  onGoWorkspace,
  onOpenLogin,
  onLogout,
  onOpenCreateJob,
}) => {
  const { login: privyLogin, logout: privyLogout, authenticated: privyAuthenticated, user: privyUser } = usePrivy();

  const handleSignOut = async () => {
    if (privyAuthenticated) {
      try {
        await privyLogout();
      } catch (e) {
        console.error('Privy logout error:', e);
      }
    }
    onLogout();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo in World.org Minimalist Style */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onGoHome}>
          <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center text-white">
            <span className="h-3 w-3 rounded-full border-2 border-white"></span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-base font-bold tracking-tight text-neutral-950">ProofPay</span>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
              Settlement Protocol
            </span>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 text-xs font-medium text-neutral-600">
          <button
            onClick={onGoHome}
            className={`px-3.5 py-1.5 rounded-full transition-all ${
              currentView === 'LANDING' ? 'text-neutral-950 bg-neutral-100 font-semibold' : 'hover:text-neutral-950'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => {
              if (currentUser && currentUser.role === 'CLIENT') {
                onGoWorkspace('CLIENT');
              } else {
                onOpenLogin('CLIENT');
              }
            }}
            className={`px-3.5 py-1.5 rounded-full transition-all ${
              currentView === 'WORKSPACE' && currentRole === 'CLIENT'
                ? 'text-neutral-950 bg-neutral-100 font-semibold'
                : 'hover:text-neutral-950'
            }`}
          >
            Client Escrows
          </button>
          <button
            onClick={() => {
              if (currentUser && currentUser.role === 'FREELANCER') {
                onGoWorkspace('FREELANCER');
              } else {
                onOpenLogin('FREELANCER');
              }
            }}
            className={`px-3.5 py-1.5 rounded-full transition-all ${
              currentView === 'WORKSPACE' && currentRole === 'FREELANCER'
                ? 'text-neutral-950 bg-neutral-100 font-semibold'
                : 'hover:text-neutral-950'
            }`}
          >
            Freelancer Payouts
          </button>
        </nav>

        {/* Right Authentication / Action Area */}
        <div className="flex items-center space-x-2.5">
          {currentUser ? (
            <div className="flex items-center space-x-2">
              {currentUser.role === 'CLIENT' && (
                <button
                  onClick={onOpenCreateJob}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black text-white hover:bg-neutral-800 text-xs font-semibold transition-all shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Escrow
                </button>
              )}

              {/* Active Profile Pill */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-200 bg-neutral-50 text-xs text-neutral-800 font-medium">
                <span className={`h-2 w-2 rounded-full ${currentUser.role === 'CLIENT' ? 'bg-black' : 'bg-neutral-600'}`}></span>
                <span className="font-semibold">{currentUser.name || currentUser.email}</span>
                <span className="text-[10px] text-neutral-400 font-mono hidden lg:inline-flex">
                  <ArcAddress address={currentUser.walletAddress} showPrivyBadge={true} />
                </span>
              </div>

              {/* Privy Console Link */}
              <a
                href="https://dashboard.privy.io"
                target="_blank"
                rel="noreferrer"
                title="Open Privy Dashboard & Policy Console"
                className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-700 hover:text-black px-2.5 py-1 rounded-full border border-neutral-200 hover:bg-neutral-100 transition-colors"
              >
                <KeyRound className="h-3 w-3 text-neutral-600" />
                <span>Privy Console</span>
                <ExternalLink className="h-2.5 w-2.5 opacity-60" />
              </a>

              {/* Logout Button */}
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="h-8 w-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => privyLogin()}
                className="px-3.5 py-1.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                title="Sign in using Privy Embedded Wallet, Email, or Social"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Privy Sign In</span>
              </button>
              <button
                onClick={() => onOpenLogin('CLIENT')}
                className="hidden sm:inline-flex px-3.5 py-1.5 rounded-full border border-neutral-300 hover:border-black text-neutral-900 text-xs font-semibold transition-all"
              >
                Client Portal
              </button>
              <button
                onClick={() => onOpenLogin('FREELANCER')}
                className="hidden sm:inline-flex px-3.5 py-1.5 rounded-full border border-neutral-300 hover:border-black text-neutral-900 text-xs font-semibold transition-all"
              >
                Freelancer Portal
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
