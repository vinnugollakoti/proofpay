import React, { useState, useEffect } from 'react';
import { Job, PaymentIntent } from './types/index.js';
import {
  fetchJobs,
  fundJob,
  acceptJob,
  submitWork,
  approveWork,
  createReleaseIntent,
  verifyAndRelease,
} from './services/api.js';
import { Navbar } from './components/Navbar.js';
import { ClientDashboard } from './pages/ClientDashboard.js';
import { FreelancerDashboard } from './pages/FreelancerDashboard.js';
import { JobDetailsPage } from './pages/JobDetailsPage.js';
import { CreateJobModal } from './pages/CreateJobModal.js';
import { WorldSelfieModal } from './components/WorldSelfieModal.js';
import { CheckCircle2, AlertOctagon, ExternalLink } from 'lucide-react';

export function App() {
  const [role, setRole] = useState<'CLIENT' | 'FREELANCER'>('CLIENT');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Release Intent & World ID State
  const [activeIntent, setActiveIntent] = useState<PaymentIntent | null>(null);
  const [signalHash, setSignalHash] = useState<string>('');
  const [isSelfieModalOpen, setIsSelfieModalOpen] = useState(false);
  const [pendingJob, setPendingJob] = useState<Job | null>(null);

  // Status Alerts
  const [successResult, setSuccessResult] = useState<{
    txHash: string;
    explorerUrl: string;
    jobTitle: string;
    amount: number;
  } | null>(null);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  const loadJobs = async () => {
    try {
      const data = await fetchJobs();
      setJobs(data.jobs || []);
    } catch (err: any) {
      console.error('Failed to load jobs:', err);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  // Handlers
  const handleFund = async (jobId: string) => {
    try {
      await fundJob(jobId, '0xmockArcTestnetTxHashDeposit');
      loadJobs();
    } catch (err: any) {
      setErrorAlert(err.message);
    }
  };

  const handleAccept = async (jobId: string) => {
    try {
      await acceptJob(jobId);
      loadJobs();
    } catch (err: any) {
      setErrorAlert(err.message);
    }
  };

  const handleSubmitDeliverable = async (jobId: string, url: string) => {
    try {
      await submitWork(jobId, url);
      loadJobs();
    } catch (err: any) {
      setErrorAlert(err.message);
    }
  };

  const handleApprove = async (jobId: string) => {
    try {
      await approveWork(jobId);
      loadJobs();
    } catch (err: any) {
      setErrorAlert(err.message);
    }
  };

  // Payment Release Orchestration
  const handleInitiateRelease = async (job: Job) => {
    setErrorAlert(null);
    setSuccessResult(null);
    setPendingJob(job);
    try {
      const result = await createReleaseIntent(job.id);
      setActiveIntent(result.paymentIntent);
      setSignalHash(result.signalHash);

      if (result.riskDecision.requiresHumanVerification) {
        setIsSelfieModalOpen(true);
      } else {
        // Low risk -> Direct release without biometric challenge
        await handleReleaseExecution(result.paymentIntent.id, undefined, job);
      }
    } catch (err: any) {
      setErrorAlert(err.message);
    }
  };

  const handleReleaseExecution = async (
    intentId: string,
    proof?: any,
    jobContext?: Job | null
  ) => {
    try {
      const res = await verifyAndRelease(intentId, proof);
      setIsSelfieModalOpen(false);
      setSuccessResult({
        txHash: res.arc.txHash,
        explorerUrl: res.arc.explorerUrl,
        jobTitle: (jobContext || pendingJob)?.title || 'Freelance Escrow',
        amount: (jobContext || pendingJob)?.amountUsdc || 500,
      });
      loadJobs();
      if (selectedJob) {
        setSelectedJob(res.job);
      }
    } catch (err: any) {
      setIsSelfieModalOpen(false);
      setErrorAlert(err.message || 'Payment execution blocked.');
      loadJobs();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        currentRole={role}
        onToggleRole={setRole}
        onOpenCreateJob={() => setIsCreateModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Success Banner */}
        {successResult && (
          <div className="bg-emerald-950/40 border border-emerald-500/50 p-4 rounded-2xl flex items-center justify-between text-xs text-emerald-200 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  Payment Released Successfully! (${successResult.amount} USDC)
                </h4>
                <p className="text-emerald-300/80 mt-0.5">
                  Verified by World Selfie Check & Privy Policy. Settled on Arc Testnet.
                </p>
              </div>
            </div>
            <a
              href={successResult.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-semibold flex items-center gap-1 transition-colors"
            >
              View on ArcScan
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {/* Error / Blocked Banner */}
        {errorAlert && (
          <div className="bg-rose-950/40 border border-rose-500/50 p-4 rounded-2xl flex items-center justify-between text-xs text-rose-200 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertOctagon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Payment Execution Blocked</h4>
                <p className="text-rose-300/80 mt-0.5">{errorAlert}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorAlert(null)}
              className="text-xs text-rose-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dynamic Views */}
        {selectedJob ? (
          <JobDetailsPage
            job={selectedJob}
            onBack={() => setSelectedJob(null)}
            onInitiateRelease={role === 'CLIENT' ? handleInitiateRelease : undefined}
          />
        ) : role === 'CLIENT' ? (
          <ClientDashboard
            jobs={jobs}
            onSelectJob={setSelectedJob}
            onFundJob={handleFund}
            onApproveWork={handleApprove}
            onInitiateRelease={handleInitiateRelease}
          />
        ) : (
          <FreelancerDashboard
            jobs={jobs}
            onSelectJob={setSelectedJob}
            onAcceptJob={handleAccept}
            onSubmitWork={handleSubmitDeliverable}
          />
        )}
      </main>

      {/* Modals */}
      <CreateJobModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onJobCreated={loadJobs}
      />

      {activeIntent && pendingJob && (
        <WorldSelfieModal
          isOpen={isSelfieModalOpen}
          onClose={() => setIsSelfieModalOpen(false)}
          signalHash={signalHash}
          paymentIntentId={activeIntent.id}
          amountUsdc={pendingJob.amountUsdc}
          recipientAddress={pendingJob.freelancerPayoutAddress}
          onSuccess={(proof) => handleReleaseExecution(activeIntent.id, proof, pendingJob)}
          onFail={(errMsg) => {
            setIsSelfieModalOpen(false);
            setErrorAlert(errMsg);
          }}
        />
      )}
    </div>
  );
}
