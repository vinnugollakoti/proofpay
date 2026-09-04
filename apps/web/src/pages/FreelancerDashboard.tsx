import React, { useState } from 'react';
import { Job } from '../types/index';
import { ArcAddress } from '../components/ArcAddress';
import { CheckCircle2, ArrowRight, Upload, ExternalLink, Briefcase, DollarSign } from 'lucide-react';

interface FreelancerDashboardProps {
  jobs: Job[];
  currentUser?: any;
  onSelectJob: (job: Job) => void;
  onAcceptJob: (jobId: string) => void;
  onSubmitWork: (jobId: string, url: string) => void;
}

export const FreelancerDashboard: React.FC<FreelancerDashboardProps> = ({
  jobs,
  currentUser,
  onSelectJob,
  onAcceptJob,
  onSubmitWork,
}) => {
  const [submissionUrls, setSubmissionUrls] = useState<Record<string, string>>({});

  const handleUrlChange = (jobId: string, value: string) => {
    setSubmissionUrls((prev) => ({ ...prev, [jobId]: value }));
  };

  const totalEarned = jobs
    .filter((j) => j.status === 'COMPLETED')
    .reduce((sum, j) => sum + j.amountUsdc, 0);

  const activeEscrowAmount = jobs
    .filter((j) => j.status === 'FUNDED' || j.status === 'WORK_SUBMITTED' || j.status === 'APPROVED')
    .reduce((sum, j) => sum + j.amountUsdc, 0);

  return (
    <div className="space-y-8">
      {/* Freelancer Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-3xl border border-neutral-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-0.5 rounded-full bg-neutral-100 text-neutral-900 border border-neutral-200">
              {currentUser?.name || 'Bob (Senior Web3 Engineer)'}
            </span>
            <span className="text-xs text-neutral-500 font-mono flex items-center gap-1">
              Payout: <ArcAddress address={currentUser?.walletAddress || '0xb0b0000000000000000000000000000000000002'} showPrivyBadge={true} />
            </span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-950 tracking-tight">Freelancer Workspace</h1>
          <p className="text-xs text-neutral-500">
            Milestone payments protected by World ID biometric verification and Privy organization policies.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs">
          <span className="text-xs font-medium text-neutral-500">Total Settled Earnings</span>
          <div className="text-3xl font-bold tracking-tight text-neutral-950 mt-1">${totalEarned.toLocaleString()} USDC</div>
          <span className="text-[11px] text-neutral-400 mt-1 block">Disbursed directly to your payout address</span>
        </div>
        <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs">
          <span className="text-xs font-medium text-neutral-500">Guaranteed Escrow in Flight</span>
          <div className="text-3xl font-bold tracking-tight text-neutral-950 mt-1">${activeEscrowAmount.toLocaleString()} USDC</div>
          <span className="text-[11px] text-neutral-400 mt-1 block">Held under ProofPay multi-factor protection</span>
        </div>
      </div>

      {/* Milestone Jobs Feed */}
      <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="px-8 py-5 border-b border-neutral-200 flex justify-between items-center bg-neutral-50/50">
          <h2 className="text-sm font-bold text-neutral-950">Active Milestones ({jobs.length})</h2>
          <span className="text-xs text-neutral-500 font-mono">Live Data from Supabase</span>
        </div>

        <div className="divide-y divide-neutral-100">
          {jobs.length === 0 ? (
            <div className="p-12 text-center text-xs text-neutral-400">
              No milestones available. Check back soon.
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="p-8 hover:bg-neutral-50/60 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        onClick={() => onSelectJob(job)}
                        className="text-base font-bold text-neutral-950 hover:underline cursor-pointer transition-colors"
                      >
                        {job.title}
                      </h3>
                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200 font-semibold">
                        {job.status}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-500 leading-relaxed">{job.description}</p>

                    <div className="flex items-center gap-4 text-xs text-neutral-500 font-mono">
                      <span>Milestone Reward: <strong className="text-neutral-950 font-bold">${job.amountUsdc} USDC</strong></span>
                      <span>•</span>
                      <span>Client: <strong className="text-neutral-900">ACME Design Studio</strong></span>
                    </div>

                    {/* Submission link if work submitted */}
                    {job.submissionUrl && (
                      <div className="text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200 flex items-center justify-between">
                        <span>Submitted Deliverable: <code className="font-mono text-neutral-900">{job.submissionUrl}</code></span>
                        <a href={job.submissionUrl} target="_blank" rel="noreferrer" className="text-black font-semibold flex items-center gap-1 hover:underline">
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full lg:w-auto">
                    <button
                      onClick={() => onSelectJob(job)}
                      className="px-4 py-2 border border-neutral-200 hover:border-black text-neutral-950 text-xs font-semibold rounded-full transition-all"
                    >
                      Audit Trail
                    </button>

                    {job.status === 'CREATED' && (
                      <button
                        onClick={() => onAcceptJob(job.id)}
                        className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-full transition-all"
                      >
                        Accept Milestone
                      </button>
                    )}

                    {(job.status === 'FUNDED' || job.status === 'ACCEPTED') && (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="url"
                          placeholder="https://github.com/... or Figma link"
                          value={submissionUrls[job.id] || ''}
                          onChange={(e) => handleUrlChange(job.id, e.target.value)}
                          className="px-3 py-1.5 bg-white border border-neutral-300 rounded-full text-xs text-neutral-900 focus:outline-none focus:border-black w-60"
                        />
                        <button
                          onClick={() => onSubmitWork(job.id, submissionUrls[job.id] || 'https://github.com/deliverable')}
                          className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-full transition-all flex items-center gap-1 shrink-0"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          Submit Work
                        </button>
                      </div>
                    )}

                    {job.status === 'WORK_SUBMITTED' && (
                      <span className="text-xs text-neutral-500 font-medium px-3.5 py-1.5 bg-neutral-100 rounded-full border border-neutral-200">
                        Under Client Review
                      </span>
                    )}

                    {job.status === 'APPROVED' && (
                      <span className="text-xs text-neutral-900 font-semibold px-3.5 py-1.5 bg-neutral-100 rounded-full border border-neutral-300">
                        Milestone Approved • Release in Progress
                      </span>
                    )}

                    {job.status === 'COMPLETED' && (
                      <span className="text-xs text-neutral-900 font-bold px-3.5 py-1.5 bg-neutral-100 rounded-full border border-neutral-200 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-black" />
                        Settled to Wallet
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
