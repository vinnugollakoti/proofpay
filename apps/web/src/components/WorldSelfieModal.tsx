import React, { useState } from 'react';
import { Camera, ShieldCheck, AlertOctagon, CheckCircle2, RefreshCw } from 'lucide-react';

interface WorldSelfieModalProps {
  isOpen: boolean;
  onClose: () => void;
  signalHash: string;
  paymentIntentId: string;
  amountUsdc: number;
  recipientAddress: string;
  onSuccess: (proof: any) => void;
  onFail: (errorMsg: string) => void;
}

export const WorldSelfieModal: React.FC<WorldSelfieModalProps> = ({
  isOpen,
  onClose,
  signalHash,
  paymentIntentId,
  amountUsdc,
  recipientAddress,
  onSuccess,
  onFail,
}) => {
  const [verifying, setVerifying] = useState(false);

  if (!isOpen) return null;

  const handlePass = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      onSuccess({
        merkle_root: '0x1c3a647890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        nullifier_hash: `0xnullifier_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`,
        proof: '0xvalid_selfie_zk_proof_world_id',
        credential_type: 'selfie',
        verification_level: 'selfie',
      });
    }, 1200);
  };

  const handleSimulateFail = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      onFail('Liveness Verification Failed: Biometric mismatch detected by World Selfie Check.');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">World ID — Selfie Check</h2>
              <p className="text-[11px] text-slate-400">Human Liveness Verification</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xs">
            ✕
          </button>
        </div>

        <div className="my-5 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs space-y-2">
          <div className="text-slate-300 font-medium">Payment Context Binding (Signal)</div>
          <div className="font-mono text-[11px] text-slate-400 break-all bg-slate-900 p-2 rounded border border-slate-800">
            Signal: {signalHash.slice(0, 32)}...
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 pt-1">
            <span>Amount: <strong className="text-white">${amountUsdc} USDC</strong></span>
            <span>Recipient: <strong className="text-white font-mono">{recipientAddress.slice(0, 8)}...</strong></span>
          </div>
        </div>

        <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-lg p-3 text-xs text-cyan-200 mb-5">
          <strong>Security Guarantee:</strong> This proof is single-use and bound exclusively to this payment intent. Replay attacks are mathematically impossible.
        </div>

        <div className="space-y-2.5">
          <button
            disabled={verifying}
            onClick={handlePass}
            className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-800 text-slate-950 font-semibold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md"
          >
            {verifying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Verifying Proof with World API...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Complete Selfie Check (Pass Proof)
              </>
            )}
          </button>

          {/* Hackathon Failure Path Demo Button */}
          <button
            disabled={verifying}
            onClick={handleSimulateFail}
            className="w-full bg-rose-950/50 hover:bg-rose-900/60 border border-rose-600/40 text-rose-300 font-medium py-2 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
          >
            <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
            Simulate Verification Failure (Demo Blocked Path)
          </button>
        </div>
      </div>
    </div>
  );
};
