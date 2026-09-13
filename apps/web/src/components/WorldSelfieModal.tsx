import React, { useState, useEffect } from 'react';
import { AlertOctagon, CheckCircle2, RefreshCw, Timer, UserCheck } from 'lucide-react';
import { IDKitRequestWidget, selfieCheckLegacy, type IDKitResult } from '@worldcoin/idkit';

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
  const [timeLeft, setTimeLeft] = useState(60);
  const [idKitOpen, setIdKitOpen] = useState(false);
  const worldAppId = import.meta.env.VITE_WORLD_APP_ID;
  const worldAction = import.meta.env.VITE_WORLD_ACTION || 'release-payment';
  const demoMode = import.meta.env.VITE_DEMO_MODE !== 'false';
  const worldRpContext = (() => {
    try {
      return JSON.parse(import.meta.env.VITE_WORLD_RP_CONTEXT_JSON || 'null');
    } catch {
      return null;
    }
  })();

  // 60-second TTL Countdown Timer
  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(60);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onFail('Authorization Expired: The 60-second World verification TTL window elapsed.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onFail]);

  if (!isOpen) return null;

  const completeWithDemoProof = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      const hexChars = '0123456789abcdef';
      const random32Hex =
        '0x' +
        Array.from({ length: 64 }, () => hexChars[Math.floor(Math.random() * 16)]).join('');
      const uint256Word = '0000000000000000000000000000000000000000000000000000000000000001';
      const proofHex = '0x' + uint256Word.repeat(8);

      onSuccess({
        merkle_root: '0x2c3a647890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        nullifier_hash: random32Hex,
        proof: proofHex,
        credential_type: 'selfie',
        verification_level: 'selfie',
      });
    }, 1200);
  };

  const handleWorldSuccess = (result: IDKitResult) => {
    const response = result.responses[0];
    if (!response || result.protocol_version !== '3.0' || !('merkle_root' in response)) {
      onFail('This World response format is not supported by the configured verifier. Use the Selfie Check legacy credential in World Developer Portal.');
      return;
    }
    setIdKitOpen(false);
    onSuccess({
      merkle_root: response.merkle_root,
      nullifier_hash: response.nullifier,
      proof: response.proof,
      credential_type: response.identifier,
      verification_level: response.identifier,
    });
  };

  const handleSimulateFail = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      const hexChars = '0123456789abcdef';
      const random32Hex =
        '0x' +
        Array.from({ length: 64 }, () => hexChars[Math.floor(Math.random() * 16)]).join('');
      onSuccess({
        merkle_root: '0x2c3a647890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        nullifier_hash: random32Hex,
        proof: 'FAIL_VERIFICATION_TEST',
        credential_type: 'selfie',
        verification_level: 'selfie',
      });
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-8 shadow-2xl relative text-neutral-950 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center text-white">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold tracking-tight text-neutral-950">World ID Selfie Check</h2>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-neutral-100 text-neutral-700 font-mono font-semibold">
                  v4 / RP
                </span>
              </div>
              <p className="text-xs text-neutral-500">Human Liveness & Biometric Verification</p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-neutral-700 font-mono bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded-full font-semibold">
            <Timer className="h-3.5 w-3.5" />
            <span>{timeLeft}s TTL</span>
          </div>
        </div>

        {/* Biometric Scanner Visualizer in World.org Minimal Style */}
        <div className="relative h-48 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col items-center justify-center overflow-hidden">
          <div className="relative z-10 flex flex-col items-center space-y-2.5">
            <div className="h-24 w-24 rounded-full border-2 border-neutral-300 flex items-center justify-center bg-white shadow-xs">
              <UserCheck className="h-10 w-10 text-neutral-700" />
            </div>
            <span className="text-xs text-neutral-500 font-medium">Continue in World App to prove human presence</span>
          </div>

          {verifying && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center space-y-2 z-20">
              <RefreshCw className="h-7 w-7 text-black animate-spin" />
              <span className="text-xs text-neutral-900 font-bold">Verifying with World ID API...</span>
            </div>
          )}
        </div>

        {/* Cryptographic Context Binding Box */}
        <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-xs space-y-2 font-mono">
          <div className="flex justify-between items-center text-neutral-600 font-semibold text-[11px]">
            <span>Cryptographic Signal Binding</span>
            <span className="text-neutral-400">keccak256</span>
          </div>
          <div className="text-[11px] text-neutral-800 break-all bg-white p-2.5 rounded-xl border border-neutral-200">
            {signalHash}
          </div>
          <div className="flex justify-between text-[11px] text-neutral-600 pt-1">
            <span>Milestone: <strong className="text-neutral-950 font-bold">${amountUsdc} USDC</strong></span>
            <span>Recipient: <strong className="text-neutral-950 font-bold">{recipientAddress.slice(0, 8)}...</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => setIdKitOpen(true)}
            disabled={verifying || !worldAppId || !worldRpContext}
            className="w-full bg-black hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-bold py-3 px-4 rounded-full text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {verifying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Verifying Proof on World API...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Verify with World ID
              </>
            )}
          </button>

          {(!worldAppId || !worldRpContext) && <p className="text-[11px] text-amber-700 text-center">Set VITE_WORLD_APP_ID and a signed VITE_WORLD_RP_CONTEXT_JSON to enable production verification.</p>}
          {demoMode && (
            <>
              <button disabled={verifying} onClick={completeWithDemoProof} className="w-full bg-white hover:bg-neutral-50 border border-neutral-300 hover:border-black text-neutral-800 font-medium py-2.5 px-4 rounded-full text-xs transition-all flex items-center justify-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Complete simulated check
              </button>
              <button disabled={verifying} onClick={handleSimulateFail} className="w-full text-neutral-500 text-xs underline">
                Simulate verification failure
              </button>
            </>
          )}
        </div>
      </div>
      {worldAppId && worldRpContext && (
        <IDKitRequestWidget
          open={idKitOpen}
          onOpenChange={setIdKitOpen}
          app_id={worldAppId as `app_${string}`}
          action={worldAction}
          rp_context={worldRpContext}
          allow_legacy_proofs={true}
          preset={selfieCheckLegacy({ signal: signalHash })}
          onSuccess={handleWorldSuccess}
          onError={() => onFail('World ID verification was cancelled or could not be completed.')}
        />
      )}
    </div>
  );
};
