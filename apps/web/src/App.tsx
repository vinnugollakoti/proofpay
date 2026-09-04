import React, { useState, useEffect } from 'react';
import { Job, PaymentIntent } from './types/index';
import {
  fetchJobs,
  fundJob,
  acceptJob,
  submitWork,
  approveWork,
  createReleaseIntent,
  verifyAndRelease,
} from './services/api';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { ClientDashboard } from './pages/ClientDashboard';
import { FreelancerDashboard } from './pages/FreelancerDashboard';
import { JobDetailsPage } from './pages/JobDetailsPage';
import { CreateJobModal } from './pages/CreateJobModal';
import { WorldSelfieModal } from './components/WorldSelfieModal';
import { ReleaseSuccessModal } from './components/ReleaseSuccessModal';
import { AuthModal } from './components/AuthModal';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';

export function App() {
  const { user: privyUser, authenticated: privyAuthenticated, logout: privyLogout } = usePrivy();
  const [view, setView] = useState<'LANDING' | 'WORKSPACE'>('LANDING');
  const [role, setRole] = useState<'CLIENT' | 'FREELANCER'>('CLIENT');
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    try {
      const saved = localStorage.getItem('proofpay_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [currentOrg, setCurrentOrg] = useState<any | null>(() => {
    try {
      const saved = localStorage.getItem('proofpay_org');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Authentication Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTargetRole, setAuthModalTargetRole] = useState<'CLIENT' | 'FREELANCER'>('CLIENT');

  // Release Intent & World ID State
  const [activeIntent, setActiveIntent] = useState<PaymentIntent | null>(null);
  const [signalHash, setSignalHash] = useState<string>('');
  const [isSelfieModalOpen, setIsSelfieModalOpen] = useState(false);
  const [pendingJob, setPendingJob] = useState<Job | null>(null);

  // Modals & Alert State
  const [successResult, setSuccessResult] = useState<{
    txHash?: string;
    explorerUrl?: string;
    jobTitle: string;
    amount: number;
    recipientAddress: string;
  } | null>(null);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  const loadJobs = async () => {
    try {
      const data = await fetchJobs();
      setJobs(data.jobs || []);
    } catch (err: any) {
      console.error('Failed to load jobs from Supabase:', err);
    }
  };

  useEffect(() => {
    loadJobs();
    if (currentUser) {
      setRole(currentUser.role);
    }
  }, []);

  // Synchronize Privy authenticated user with ProofPay workspace
  useEffect(() => {
    if (privyAuthenticated && privyUser && !currentUser) {
      const walletAddress =
        privyUser.wallet?.address ||
        (privyUser.linkedAccounts?.find((a: any) => a.type === 'wallet') as any)?.address ||
        '0x37Da1f17986e4DC6d4E8D86713791698F07c8099';

      const email =
        privyUser.email?.address ||
        (privyUser.google?.email as string) ||
        `${privyUser.id.slice(0, 10)}@privy.id`;

      const userObj = {
        id: privyUser.id,
        privyUserId: privyUser.id,
        email,
        walletAddress,
        role: role || 'CLIENT',
        organizationId: 'org-acme-design',
        name: email.split('@')[0],
      };

      const orgObj = {
        id: 'org-acme-design',
        name: 'ACME Design Studio',
        privyOrgId: 'privy-org-acme',
        walletAddress: '0x37Da1f17986e4DC6d4E8D86713791698F07c8099',
        maxReleaseLimitUsdc: 2500,
      };

      setCurrentUser(userObj);
      setCurrentOrg(orgObj);
      localStorage.setItem('proofpay_user', JSON.stringify(userObj));
      localStorage.setItem('proofpay_org', JSON.stringify(orgObj));
      setView('WORKSPACE');
      loadJobs();
    }
  }, [privyAuthenticated, privyUser]);

  const handleOpenLogin = (targetRole: 'CLIENT' | 'FREELANCER') => {
    setAuthModalTargetRole(targetRole);
    setIsAuthModalOpen(true);
  };

  const handleLoginSuccess = (user: any, org?: any) => {
    setCurrentUser(user);
    setCurrentOrg(org || null);
    localStorage.setItem('proofpay_user', JSON.stringify(user));
    if (org) {
      localStorage.setItem('proofpay_org', JSON.stringify(org));
    }
    setRole(user.role);
    setView('WORKSPACE');
    loadJobs();
  };

  const handleLogout = async () => {
    try {
      if (privyAuthenticated) {
        await privyLogout();
      }
    } catch (e) {
      console.error('Privy logout error:', e);
    }
    setCurrentUser(null);
    setCurrentOrg(null);
    localStorage.removeItem('proofpay_user');
    localStorage.removeItem('proofpay_org');
    setView('LANDING');
    setSelectedJob(null);
  };

  const handleFund = async (jobId: string) => {
    try {
      await fundJob(jobId);
      await loadJobs();
    } catch (err: any) {
      setErrorAlert(err.message);
    }
  };

  const handleAccept = async (jobId: string) => {
    try {
      await acceptJob(jobId);
      await loadJobs();
    } catch (err: any) {
      setErrorAlert(err.message);
    }
  };

  const handleSubmitDeliverable = async (jobId: string, url: string) => {
    try {
      await submitWork(jobId, url);
      await loadJobs();
    } catch (err: any) {
      setErrorAlert(err.message);
    }
  };

  const handleApprove = async (jobId: string) => {
    try {
      await approveWork(jobId);
      await loadJobs();
    } catch (err: any) {
      setErrorAlert(err.message);
    }
  };

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
      const targetJob = jobContext || pendingJob;
      const res = await verifyAndRelease(intentId, proof);
      setIsSelfieModalOpen(false);
      setSuccessResult({
        txHash: res.arc?.txHash,
        explorerUrl: res.arc?.explorerUrl,
        jobTitle: targetJob?.title || 'Freelance Milestone',
        amount: targetJob?.amountUsdc || 500,
        recipientAddress: targetJob?.freelancerPayoutAddress || '',
      });
      await loadJobs();
      if (selectedJob) {
        setSelectedJob(res.job);
      }
    } catch (err: any) {
      setIsSelfieModalOpen(false);
      setErrorAlert(err.message || 'Payment execution blocked.');
      await loadJobs();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-neutral-950 flex flex-col font-sans selection:bg-neutral-900 selection:text-white">
      <Navbar
        currentUser={currentUser}
        currentOrg={currentOrg}
        currentRole={role}
        currentView={view}
        onGoHome={() => {
          setView('LANDING');
          setSelectedJob(null);
        }}
        onGoWorkspace={(targetRole) => {
          if (targetRole) {
            setRole(targetRole);
          }
          setView('WORKSPACE');
        }}
        onOpenLogin={handleOpenLogin}
        onLogout={handleLogout}
        onOpenCreateJob={() => setIsCreateModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Error / Blocked Notification Banner */}
        {errorAlert && (
          <div className="bg-white border border-rose-200 p-5 rounded-3xl flex items-center justify-between text-xs text-rose-900 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-neutral-950 text-sm">Action Blocked / Error</h4>
                <p className="text-neutral-600 mt-0.5">{errorAlert}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorAlert(null)}
              className="text-xs text-neutral-500 hover:text-black font-semibold px-3 py-1.5 rounded-full hover:bg-neutral-100 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* View Switcher */}
        {view === 'LANDING' ? (
          <LandingPage
            onEnterClient={() => {
              if (currentUser && currentUser.role === 'CLIENT') {
                setRole('CLIENT');
                setView('WORKSPACE');
              } else {
                handleOpenLogin('CLIENT');
              }
            }}
            onEnterFreelancer={() => {
              if (currentUser && currentUser.role === 'FREELANCER') {
                setRole('FREELANCER');
                setView('WORKSPACE');
              } else {
                handleOpenLogin('FREELANCER');
              }
            }}
            clientLoggedIn={Boolean(currentUser && currentUser.role === 'CLIENT')}
            freelancerLoggedIn={Boolean(currentUser && currentUser.role === 'FREELANCER')}
          />
        ) : selectedJob ? (
          <JobDetailsPage
            job={selectedJob}
            onBack={() => setSelectedJob(null)}
            onInitiateRelease={role === 'CLIENT' ? handleInitiateRelease : undefined}
          />
        ) : role === 'CLIENT' ? (
          <ClientDashboard
            jobs={jobs}
            currentUser={currentUser}
            currentOrg={currentOrg}
            onSelectJob={setSelectedJob}
            onFundJob={handleFund}
            onApproveWork={handleApprove}
            onInitiateRelease={handleInitiateRelease}
            onOpenCreateJob={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <FreelancerDashboard
            jobs={jobs}
            currentUser={currentUser}
            onSelectJob={setSelectedJob}
            onAcceptJob={handleAccept}
            onSubmitWork={handleSubmitDeliverable}
          />
        )}
      </main>

      {/* Authentication Modal for Client / Freelancer */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        targetRole={authModalTargetRole}
        onLoginSuccess={handleLoginSuccess}
        onSwitchRole={setAuthModalTargetRole}
      />

      {/* Create Job Modal */}
      <CreateJobModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onJobCreated={loadJobs}
      />

      {/* World ID Selfie Check Modal */}
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

      {/* Release Confirmation Modal */}
      {successResult && (
        <ReleaseSuccessModal
          isOpen={Boolean(successResult)}
          onClose={() => setSuccessResult(null)}
          txHash={successResult.txHash}
          explorerUrl={successResult.explorerUrl}
          jobTitle={successResult.jobTitle}
          amount={successResult.amount}
          recipientAddress={successResult.recipientAddress}
        />
      )}
    </div>
  );
}
