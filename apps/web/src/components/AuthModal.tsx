import React, { useState } from 'react';
import { X, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, UserCheck, AlertCircle, KeyRound, ExternalLink } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { loginUser } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole: 'CLIENT' | 'FREELANCER';
  onLoginSuccess: (user: any, organization?: any) => void;
  onSwitchRole: (role: 'CLIENT' | 'FREELANCER') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  targetRole,
  onLoginSuccess,
  onSwitchRole,
}) => {
  const { login: privyLogin, authenticated: privyAuthenticated } = usePrivy();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isClient = targetRole === 'CLIENT';

  const handleFillDemoCreds = () => {
    setError(null);
    if (isClient) {
      setEmail('client@acmedesign.com');
      setPassword('password123');
    } else {
      setEmail('freelancer@bobdesigns.io');
      setPassword('password123');
    }
  };

  const handlePrivyAuth = () => {
    onClose();
    privyLogin();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginUser({ email, password, role: targetRole });
      setLoading(false);
      onLoginSuccess(res.user, res.organization);
      onClose();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Login failed. Please check credentials.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-8 shadow-2xl relative text-neutral-950 space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-900 transition-colors h-8 w-8 rounded-full flex items-center justify-center hover:bg-neutral-100"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="space-y-2 text-center pt-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-neutral-100 border border-neutral-200 text-neutral-900 mb-2">
            {isClient ? <ShieldCheck className="h-6 w-6" /> : <UserCheck className="h-6 w-6" />}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-950">
            {isClient ? 'Client Portal Sign In' : 'Freelancer Portal Sign In'}
          </h2>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto">
            {isClient
              ? 'Access organization escrow reserves, review work deliverables, and authorize payments.'
              : 'Accept milestone contracts, submit deliverables, and track verified USDC payouts.'}
          </p>
        </div>

        {/* Role Switch Tabs */}
        <div className="flex bg-neutral-100 p-1 rounded-full border border-neutral-200 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setError(null);
              onSwitchRole('CLIENT');
            }}
            className={`flex-1 py-1.5 rounded-full transition-all ${
              isClient ? 'bg-white text-black shadow-xs font-semibold' : 'text-neutral-500 hover:text-black'
            }`}
          >
            Client Login
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              onSwitchRole('FREELANCER');
            }}
            className={`flex-1 py-1.5 rounded-full transition-all ${
              !isClient ? 'bg-white text-black shadow-xs font-semibold' : 'text-neutral-500 hover:text-black'
            }`}
          >
            Freelancer Login
          </button>
        </div>

        {/* Primary Privy Authentication Button */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handlePrivyAuth}
            className="w-full py-3.5 px-5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <KeyRound className="h-4 w-4" />
            <span>Connect with Privy (Embedded Wallet / Social)</span>
          </button>
          <div className="flex justify-between items-center px-2 text-[10px] text-neutral-500">
            <span>Privy App ID: <code className="font-mono text-neutral-700">cmtn2zia...yhx0</code></span>
            <a
              href="https://dashboard.privy.io"
              target="_blank"
              rel="noreferrer"
              className="hover:underline text-neutral-700 flex items-center gap-0.5"
            >
              Privy Console <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        </div>

        <div className="relative flex items-center justify-center my-2">
          <div className="border-t border-neutral-200 w-full"></div>
          <span className="bg-white px-3 text-[10px] uppercase font-semibold text-neutral-400 font-mono tracking-wider shrink-0">
            Or Demo Account
          </span>
        </div>

        {/* Demo Credentials Quick Fill Banner */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3.5 space-y-2">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-semibold text-neutral-700">Supabase Injected Demo Credentials:</span>
            <button
              type="button"
              onClick={handleFillDemoCreds}
              className="text-xs font-bold text-black underline hover:text-neutral-600 transition-colors"
            >
              One-Click Fill
            </button>
          </div>
          <div className="text-[11px] font-mono text-neutral-600 bg-white p-2 rounded-xl border border-neutral-200">
            <div>Email: <strong className="text-neutral-900">{isClient ? 'client@acmedesign.com' : 'freelancer@bobdesigns.io'}</strong></div>
            <div>Pass: <strong className="text-neutral-900">password123</strong></div>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isClient ? 'client@acmedesign.com' : 'freelancer@bobdesigns.io'}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-full text-xs text-neutral-950 focus:outline-none focus:border-black transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-full text-xs text-neutral-950 focus:outline-none focus:border-black transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-black hover:bg-neutral-800 disabled:bg-neutral-300 text-white rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? 'Authenticating with Supabase...' : `Enter ${isClient ? 'Client' : 'Freelancer'} Workspace`}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
