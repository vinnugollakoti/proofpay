import React, { useEffect, useState } from 'react';
import { Job, AuditEvent } from '../types/index';
import { fetchAuditTimeline } from '../services/api';
import { AuditTimeline } from '../components/AuditTimeline';
import { ArcAddress } from '../components/ArcAddress';
import { ArrowLeft, ExternalLink, ShieldCheck, DollarSign, KeyRound } from 'lucide-react';

interface JobDetailsPageProps {
  job: Job;
  onBack: () => void;
  onInitiateRelease?: (job: Job) => void;
}

export const JobDetailsPage: React.FC<JobDetailsPageProps> = ({
  job,
  onBack,
  onInitiateRelease,
}) => {
  const [timeline, setTimeline] = useState<AuditEvent[]>([]);

  useEffect(() => {
    fetchAuditTimeline(job.id)
      .then((data) => setTimeline(data.timeline || []))
      .catch(console.error);
  }, [job.id]);

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="text-xs text-neutral-500 hover:text-neutral-950 flex items-center gap-1.5 transition-colors font-medium"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Dashboard
      </button>

      {/* Main Details Card */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-8 space-y-6 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono px-3 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
              ID: {job.id}
            </span>
            <h1 className="text-2xl font-bold text-neutral-950 tracking-tight mt-2">{job.title}</h1>
            <p className="text-xs text-neutral-600 max-w-2xl">{job.description}</p>
          </div>

          <div className="text-right">
            <div className="text-3xl font-black text-neutral-950 font-mono tracking-tight">
              ${job.amountUsdc} <span className="text-sm font-semibold text-neutral-500">USDC</span>
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">
              Status: <span className="font-bold text-neutral-900">{job.status}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
            <span className="text-neutral-500 block text-[10px] font-mono uppercase">Client Organization Wallet</span>
            <span className="text-neutral-900 font-mono font-medium flex items-center gap-1 mt-0.5">
              <ArcAddress
                address="0x37Da1f17986e4DC6d4E8D86713791698F07c8099"
                label="0x37Da1f...8099 (ACME Vault)"
                showPrivyBadge={true}
              />
            </span>
          </div>
          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
            <span className="text-neutral-500 block text-[10px] font-mono uppercase">Freelancer Destination</span>
            <span className="text-neutral-900 font-mono font-medium flex items-center gap-1 mt-0.5">
              <ArcAddress address={job.freelancerPayoutAddress} showPrivyBadge={true} />
            </span>
          </div>
          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
            <span className="text-neutral-500 block text-[10px] font-mono uppercase">Settlement Contract (Arc L1)</span>
            <span className="text-neutral-900 font-mono font-medium flex items-center gap-1 mt-0.5">
              <ArcAddress address="0x60cfC204D8D7A2a87483c08Be5127193545b4894" label="0x60cf...4894 (Escrow)" />
            </span>
          </div>
        </div>

        {/* Privy Policy Card */}
        <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center shrink-0">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <div className="font-bold text-neutral-950 flex items-center gap-2">
                <span>Privy Organization Policy Active</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-neutral-200 text-neutral-800 font-semibold">
                  proofpay enclave
                </span>
              </div>
              <div className="text-[11px] text-neutral-500">Max per-transaction cap: $2,500 USDC • Destination whitelisting verified</div>
            </div>
          </div>
          <a
            href="https://dashboard.privy.io"
            target="_blank"
            rel="noreferrer"
            title="Inspect Organization Policies in Privy Dashboard"
            className="text-[11px] font-mono px-3 py-1.5 rounded-full bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-900 font-semibold transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <span>Policy: Compliant (${job.amountUsdc} ≤ $2,500)</span>
            <ExternalLink className="h-3 w-3 text-neutral-500" />
          </a>
        </div>

        {onInitiateRelease && job.status === 'APPROVED' && (
          <div className="pt-2">
            <button
              onClick={() => onInitiateRelease(job)}
              className="w-full sm:w-auto px-6 py-3 bg-black hover:bg-neutral-800 text-white rounded-full text-xs font-bold transition-all shadow-sm"
            >
              Initiate Multi-Factor Payment Release
            </button>
          </div>
        )}
      </div>

      {/* Audit Timeline */}
      <AuditTimeline events={timeline} />
    </div>
  );
};
