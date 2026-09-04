import React, { useState } from 'react';
import { Job } from '../types/index.js';
import { Briefcase, Send, CheckCircle, ExternalLink } from 'lucide-react';

interface FreelancerDashboardProps {
  jobs: Job[];
  onAcceptJob: (jobId: string) => void;
  onSubmitWork: (jobId: string, url: string) => void;
  onSelectJob: (job: Job) => void;
}

export const FreelancerDashboard: React.FC<FreelancerDashboardProps> = ({
  jobs,
  onAcceptJob,
  onSubmitWork,
  onSelectJob,
}) => {
  const [submissionUrls, setSubmissionUrls] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950/40 p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            Freelancer View
          </span>
          <span className="text-xs text-slate-400 font-mono">0xb0b000...0002</span>
        </div>
        <h1 className="text-xl font-bold text-white mt-1">Freelance Job Deliverables</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Accept jobs, submit deliverables, and receive guaranteed Arc USDC escrow settlement.
        </p>
      </div>

      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3
                  onClick={() => onSelectJob(job)}
                  className="text-base font-bold text-white hover:text-indigo-400 cursor-pointer"
                >
                  {job.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{job.description}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-extrabold text-white font-mono">
                  ${job.amountUsdc} <span className="text-xs text-indigo-400">USDC</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                  Status: {job.status}
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {job.status === 'CREATED' && (
                <button
                  onClick={() => onAcceptJob(job.id)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Accept Job Offer
                </button>
              )}

              {job.status === 'FUNDED' && (
                <div className="flex-1 flex gap-2">
                  <input
                    type="url"
                    placeholder="Enter submission URL (e.g. GitHub repo, Figma link)"
                    value={submissionUrls[job.id] || ''}
                    onChange={(e) =>
                      setSubmissionUrls({ ...submissionUrls, [job.id]: e.target.value })
                    }
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => onSubmitWork(job.id, submissionUrls[job.id] || 'https://deliverable.demo')}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Submit Work
                  </button>
                </div>
              )}

              {job.status === 'WORK_SUBMITTED' && (
                <div className="text-xs text-amber-400 flex items-center gap-1.5">
                  Work submitted! Awaiting client review and release authorization.
                </div>
              )}

              {job.status === 'COMPLETED' && (
                <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-semibold">
                  <CheckCircle className="h-4 w-4" />
                  Payout Released! Funds received on Arc Testnet.
                </div>
              )}

              <button
                onClick={() => onSelectJob(job)}
                className="text-xs text-slate-400 hover:text-white underline sm:self-center"
              >
                View Audit Timeline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
