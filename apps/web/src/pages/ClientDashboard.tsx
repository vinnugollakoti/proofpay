import React, { useState, useEffect } from 'react';
import { Job } from '../types/index';
import { SecurityBadge } from '../components/SecurityBadge';
import { ArcAddress } from '../components/ArcAddress';
import { CheckCircle, AlertCircle, ArrowRight, ShieldCheck, DollarSign, ExternalLink, Plus, KeyRound, Wallet, RefreshCw } from 'lucide-react';
import { fetchVaultStatus } from '../services/api';

interface ClientDashboardProps {
  jobs: Job[];
  currentUser?: any;
  currentOrg?: any;
  onSelectJob: (job: Job) => void;
  onFundJob: (jobId: string) => void;
  onApproveWork: (jobId: string) => void;
  onInitiateRelease: (job: Job) => void;
  onOpenCreateJob?: () => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  jobs,
  currentUser,
  currentOrg,
  onSelectJob,
  onFundJob,
  onApproveWork,
  onInitiateRelease,
  onOpenCreateJob,
}) => {
  const [vault, setVault] = useState<any>(null);
  const [loadingVault, setLoadingVault] = useState(false);

  const loadVault = () => {
    setLoadingVault(true);
    fetchVaultStatus()
      .then((data) => setVault(data))
      .catch((err) => console.error('Failed to load vault status:', err))
      .finally(() => setLoadingVault(false));
  };

  useEffect(() => {
    loadVault();
  }, []);

  const totalVolume = jobs.reduce((sum, j) => sum + j.amountUsdc, 0);
  const activeCount = jobs.filter((j) => j.status !== 'COMPLETED').length;
  const completedCount = jobs.filter((j) => j.status === 'COMPLETED').length;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-3xl border border-neutral-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-0.5 rounded-full bg-neutral-100 text-neutral-900 border border-neutral-200">
              {currentOrg?.name || 'ACME Design Studio'}
            </span>
            <ArcAddress
              address={currentUser?.walletAddress || '0xa11ce00000000000000000000000000000000001'}
              className="text-xs text-neutral-500"
            />
          </div>
          <h1 className="text-2xl font-bold text-neutral-950 tracking-tight">Client Escrow Dashboard</h1>
          <p className="text-xs text-neutral-500">
            Escrow disbursements protected by World ID biometric verification and Privy organization policies.
          </p>
        </div>

        {onOpenCreateJob && (
          <button
            onClick={onOpenCreateJob}
            className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Milestone Job
          </button>
        )}
      </div>

      {/* Arc Vault & Privy Policy Infrastructure Card */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-black text-white flex items-center justify-center shrink-0">
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-neutral-950">Arc L1 Settlement Vault & Privy Policies</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  Chain 5042002 • ONLINE
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Managed onchain treasury holding USDC for escrow funding & automated release
              </p>
            </div>
          </div>
          <button
            onClick={loadVault}
            disabled={loadingVault}
            className="self-start sm:self-auto px-3 py-1.5 rounded-full border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${loadingVault ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-neutral-50/80 p-4 rounded-2xl border border-neutral-200/80">
            <span className="text-neutral-500 block text-[10px] font-mono uppercase font-semibold">
              Privy Managed Vault Address
            </span>
            <span className="font-mono font-bold text-neutral-900 mt-1 block">
              <ArcAddress
                address={vault?.vaultAddress || '0x37Da1f17986e4DC6d4E8D86713791698F07c8099'}
                label={vault?.vaultAddress ? undefined : '0x37Da1f...8099 (Arc Vault)'}
                showPrivyBadge={true}
              />
            </span>
            <span className="text-[11px] text-neutral-500 mt-1 block">
              Gas Balance: <span className="font-mono font-semibold text-neutral-800">{vault ? Number(vault.gasBalance).toFixed(2) : '100.00'} ETH/USDC</span>
            </span>
          </div>

          <div className="bg-neutral-50/80 p-4 rounded-2xl border border-neutral-200/80">
            <span className="text-neutral-500 block text-[10px] font-mono uppercase font-semibold">
              Arc Testnet USDC Balance
            </span>
            <div className="text-2xl font-bold tracking-tight text-neutral-950 mt-1 font-mono">
              ${vault ? Number(vault.usdcBalance).toFixed(2) : '100.00'} <span className="text-sm font-semibold text-neutral-500">USDC</span>
            </div>
            <span className="text-[11px] text-neutral-500 mt-1 block">
              Precompile: <ArcAddress address="0x3600000000000000000000000000000000000000" label="0x3600...0000 (USDC)" />
            </span>
          </div>

          <div className="bg-neutral-50/80 p-4 rounded-2xl border border-neutral-200/80">
            <span className="text-neutral-500 block text-[10px] font-mono uppercase font-semibold">
              ProofPay Escrow Contract
            </span>
            <span className="font-mono font-bold text-neutral-900 mt-1 block">
              <ArcAddress
                address={vault?.escrowContractAddress || '0x60cfC204D8D7A2a87483c08Be5127193545b4894'}
              />
            </span>
            <span className="text-[11px] text-neutral-500 mt-1 block">
              Privy Policy: <span className="font-semibold text-neutral-800">Max ${currentOrg?.maxReleaseLimitUsdc || 2500} / tx</span>
            </span>
          </div>
        </div>
      </div>

      {/* Financial Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs">
          <span className="text-xs font-medium text-neutral-500">Total Escrow Volume</span>
          <div className="text-3xl font-bold tracking-tight text-neutral-950 mt-1">${totalVolume.toLocaleString()} USDC</div>
          <span className="text-[11px] text-neutral-400 mt-1 block">Live records from Supabase</span>
        </div>
        <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs">
          <span className="text-xs font-medium text-neutral-500">Privy Policy Spending Cap</span>
          <div className="text-3xl font-bold tracking-tight text-neutral-950 mt-1">${(currentOrg?.maxReleaseLimitUsdc || 5000).toLocaleString()} USDC</div>
          <span className="text-[11px] text-neutral-400 mt-1 block">Per-transaction limit enforced by Privy</span>
        </div>
        <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs">
          <span className="text-xs font-medium text-neutral-500">Active Milestones</span>
          <div className="text-3xl font-bold tracking-tight text-neutral-950 mt-1">{activeCount}</div>
          <span className="text-[11px] text-neutral-400 mt-1 block">In Progress or Awaiting Release</span>
        </div>
        <div className="bg-white border border-neutral-200 p-6 rounded-3xl shadow-xs">
          <span className="text-xs font-medium text-neutral-500">Completed Disbursements</span>
          <div className="text-3xl font-bold tracking-tight text-neutral-950 mt-1">{completedCount}</div>
          <span className="text-[11px] text-neutral-400 mt-1 block">Settled to Freelancer Wallets</span>
        </div>
      </div>

      {/* Security Architecture Badge */}
      <SecurityBadge requiresHumanVerification={true} riskLevel="HIGH" />

      {/* Jobs Table */}
      <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="px-8 py-5 border-b border-neutral-200 flex justify-between items-center bg-neutral-50/50">
          <h2 className="text-sm font-bold text-neutral-950">Active Escrow Milestones ({jobs.length})</h2>
          <span className="text-xs text-neutral-500 font-mono">Live Data from Supabase</span>
        </div>

        <div className="divide-y divide-neutral-100">
          {jobs.length === 0 ? (
            <div className="p-12 text-center text-xs text-neutral-400">
              No active escrow contracts found in database. Click "Create Milestone Job" to begin.
            </div>
          ) : (
            jobs.map((job) => {
              const isHighValue = job.amountUsdc >= 500;
              return (
                <div key={job.id} className="p-8 hover:bg-neutral-50/60 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          onClick={() => onSelectJob(job)}
                          className="text-base font-bold text-neutral-950 hover:underline cursor-pointer transition-colors"
                        >
                          {job.title}
                        </h3>
                        <span
                          className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border font-semibold ${
                            job.status === 'COMPLETED'
                              ? 'bg-neutral-100 text-neutral-800 border-neutral-300'
                              : job.status === 'APPROVED'
                              ? 'bg-black text-white border-black'
                              : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                          }`}
                        >
                          {job.status}
                        </span>

                        {isHighValue && (
                          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-300">
                            HIGH RISK (≥$500) • World Selfie Check Required
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-neutral-500 leading-relaxed">{job.description}</p>

                      <div className="flex items-center gap-4 text-xs text-neutral-500 pt-1 font-mono">
                        <span className="flex items-center gap-1">
                          Payout to: <ArcAddress address={job.freelancerPayoutAddress} showPrivyBadge={true} />
                        </span>
                        <span>•</span>
                        <span>Escrow: <strong className="text-neutral-900 font-bold">${job.amountUsdc} USDC</strong></span>
                        {job.submissionUrl && (
                          <>
                            <span>•</span>
                            <a
                              href={job.submissionUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-black underline font-semibold flex items-center gap-1"
                            >
                              Deliverable <ExternalLink className="h-3 w-3" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectJob(job)}
                        className="px-4 py-2 border border-neutral-200 hover:border-black text-neutral-950 text-xs font-semibold rounded-full transition-all"
                      >
                        Inspect Audit
                      </button>

                      {job.status === 'CREATED' && (
                        <button
                          onClick={() => onFundJob(job.id)}
                          className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-full transition-all"
                        >
                          Fund Escrow
                        </button>
                      )}

                      {job.status === 'WORK_SUBMITTED' && (
                        <button
                          onClick={() => onApproveWork(job.id)}
                          className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-full transition-all"
                        >
                          Approve Deliverable
                        </button>
                      )}

                      {job.status === 'APPROVED' && (
                        <button
                          onClick={() => onInitiateRelease(job)}
                          className="px-5 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-full transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <span>Authorize Release</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {job.status === 'COMPLETED' && (
                        <span className="text-xs text-neutral-500 font-medium px-3 py-1 bg-neutral-100 rounded-full">
                          Disbursed ✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
