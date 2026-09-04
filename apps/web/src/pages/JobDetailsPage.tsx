import React, { useEffect, useState } from 'react';
import { Job, AuditEvent } from '../types/index.js';
import { fetchAuditTimeline } from '../services/api.js';
import { AuditTimeline } from '../components/AuditTimeline.js';
import { SecurityBadge } from '../components/SecurityBadge.js';
import { ArrowLeft, ExternalLink, ShieldCheck, DollarSign } from 'lucide-react';

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
        className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Dashboard
      </button>

      {/* Main Details Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              Job ID: {job.id}
            </span>
            <h1 className="text-xl font-bold text-white mt-1">{job.title}</h1>
            <p className="text-xs text-slate-400 mt-1">{job.description}</p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black text-white font-mono">
              ${job.amountUsdc} <span className="text-xs text-emerald-400">USDC</span>
            </div>
            <div className="text-xs text-slate-400">Status: <span className="font-semibold text-emerald-400">{job.status}</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Client</span>
            <span className="text-slate-200 font-mono">0xa11ce00...0001 (ACME)</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Freelancer Payout</span>
            <span className="text-slate-200 font-mono">{job.freelancerPayoutAddress.slice(0, 14)}...</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Arc Escrow Hash</span>
            <span className="text-blue-400 font-mono">{job.escrowId ? `${job.escrowId.slice(0, 14)}...` : 'Pending Funding'}</span>
          </div>
        </div>

        {job.status === 'APPROVED' && onInitiateRelease && (
          <div className="pt-2">
            <button
              onClick={() => onInitiateRelease(job)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <ShieldCheck className="h-4 w-4" />
              Trigger Multi-Layer Payment Release
            </button>
          </div>
        )}
      </div>

      <SecurityBadge requiresHumanVerification={job.amountUsdc >= 500} riskLevel={job.amountUsdc >= 500 ? 'HIGH' : 'LOW'} />

      {/* Audit Timeline */}
      <AuditTimeline events={timeline} />
    </div>
  );
};
