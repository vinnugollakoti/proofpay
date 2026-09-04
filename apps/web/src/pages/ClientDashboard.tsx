import React from 'react';
import { Job } from '../types/index.js';
import { SecurityBadge } from '../components/SecurityBadge.js';
import { CheckCircle, AlertCircle, ArrowRight, ShieldCheck, DollarSign, ExternalLink } from 'lucide-react';

interface ClientDashboardProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  onFundJob: (jobId: string) => void;
  onApproveWork: (jobId: string) => void;
  onInitiateRelease: (job: Job) => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  jobs,
  onSelectJob,
  onFundJob,
  onApproveWork,
  onInitiateRelease,
}) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 to-slate-900/50 p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              ACME Design Studio
            </span>
            <span className="text-xs text-slate-400 font-mono">0xa11ce0...0001</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">Client Escrow Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            USDC escrows secured by World ID biometric verification and Privy organization policies.
          </p>
        </div>
      </div>

      <SecurityBadge requiresHumanVerification={true} riskLevel="HIGH" />

      {/* Jobs List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-sm font-bold text-white">Active Escrow Contracts</h2>
          <span className="text-xs text-slate-400">{jobs.length} Total</span>
        </div>

        <div className="divide-y divide-slate-800">
          {jobs.map((job) => {
            const isHighValue = job.amountUsdc >= 500;
            return (
              <div key={job.id} className="p-6 hover:bg-slate-800/30 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3
                        onClick={() => onSelectJob(job)}
                        className="text-sm font-bold text-white hover:text-emerald-400 cursor-pointer transition-colors"
                      >
                        {job.title}
                      </h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          job.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : job.status === 'APPROVED'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {job.status}
                      </span>
                      {isHighValue && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                          🛡️ World Selfie Required
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 max-w-2xl">{job.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                      <span>Payout To: <strong className="text-slate-300 font-mono">{job.freelancerPayoutAddress.slice(0, 10)}...</strong></span>
                      <span>Settlement: <strong className="text-blue-400">Arc USDC</strong></span>
                    </div>
                  </div>

                  {/* Actions & Price */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-base font-extrabold text-white font-mono">
                        ${job.amountUsdc} <span className="text-xs text-emerald-400">USDC</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Arc Chain (5042002)</div>
                    </div>

                    <div className="flex items-center gap-2">
                      {job.status === 'CREATED' && (
                        <button
                          onClick={() => onFundJob(job.id)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          Fund Escrow
                        </button>
                      )}

                      {job.status === 'WORK_SUBMITTED' && (
                        <button
                          onClick={() => onApproveWork(job.id)}
                          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          Review & Approve
                        </button>
                      )}

                      {job.status === 'APPROVED' && (
                        <button
                          onClick={() => onInitiateRelease(job)}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Release Payment
                        </button>
                      )}

                      <button
                        onClick={() => onSelectJob(job)}
                        className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                        title="View Details & Audit Trail"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
