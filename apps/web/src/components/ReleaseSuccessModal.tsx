import React from 'react';
import { CheckCircle2, ExternalLink, ArrowRight, X, ShieldCheck } from 'lucide-react';
import { ArcAddress } from './ArcAddress';

interface ReleaseSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  txHash?: string;
  explorerUrl?: string;
  jobTitle: string;
  amount: number;
  recipientAddress: string;
}

export const ReleaseSuccessModal: React.FC<ReleaseSuccessModalProps> = ({
  isOpen,
  onClose,
  txHash,
  explorerUrl,
  jobTitle,
  amount,
  recipientAddress,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-8 shadow-2xl relative text-neutral-950 space-y-6">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-900 transition-colors h-8 w-8 rounded-full flex items-center justify-center hover:bg-neutral-100"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center text-white shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
              Settlement Completed
            </span>
            <h2 className="text-xl font-bold tracking-tight text-neutral-950">Disbursement Cleared</h2>
          </div>
        </div>

        <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 space-y-3 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-200/60">
            <span className="text-neutral-500">Milestone</span>
            <span className="text-neutral-950 font-bold">{jobTitle}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-neutral-200/60">
            <span className="text-neutral-500">Disbursed Amount</span>
            <span className="text-neutral-950 font-extrabold font-mono text-sm">${amount} USDC</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-neutral-200/60">
            <span className="text-neutral-500">Recipient Payout</span>
            <ArcAddress address={recipientAddress} className="text-neutral-900 font-medium" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-500">Authorization Pipeline</span>
            <span className="text-neutral-950 font-semibold">World ID + Privy Policy Enforced</span>
          </div>
        </div>

        {txHash && (
          <div className="p-4 bg-neutral-950 text-white rounded-2xl flex items-center justify-between gap-3 text-xs border border-neutral-800 shadow-md">
            <div>
              <div className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider font-semibold">
                Onchain Settlement (Arc L1)
              </div>
              <div className="font-mono text-xs font-bold text-neutral-200 mt-0.5">
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </div>
            </div>
            <a
              href={explorerUrl || `https://testnet.arcscan.app/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-black font-bold rounded-full text-xs hover:bg-neutral-100 transition-colors shrink-0"
            >
              ArcScan <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* 3 Pillars Pass Pills */}
        <div className="grid grid-cols-3 gap-2 text-[11px] text-center font-medium">
          <div className="bg-neutral-100 p-2.5 rounded-xl border border-neutral-200 text-neutral-900">
            World Selfie ✓
          </div>
          <div className="bg-neutral-100 p-2.5 rounded-xl border border-neutral-200 text-neutral-900">
            Privy Policy ✓
          </div>
          <div className="bg-neutral-100 p-2.5 rounded-xl border border-neutral-200 text-neutral-900">
            Escrow Released ✓
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full bg-black hover:bg-neutral-800 text-white py-3 px-5 rounded-full text-xs font-bold transition-all text-center shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
