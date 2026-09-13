import React, { useState } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import { createJob } from '../services/api';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: () => void;
}

export const CreateJobModal: React.FC<CreateJobModalProps> = ({
  isOpen,
  onClose,
  onJobCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amountUsdc, setAmountUsdc] = useState('500');
  const [freelancerPayoutAddress, setFreelancerPayoutAddress] = useState(
    '0xb0b0000000000000000000000000000000000002'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createJob({
        title,
        description,
        amountUsdc: Number(amountUsdc),
        freelancerPayoutAddress,
      });
      onJobCreated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-neutral-200 rounded-3xl max-w-lg w-full p-8 shadow-2xl relative text-neutral-950 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-950">Create Escrow Milestone</h2>
            <p className="text-xs text-neutral-500">Protected by World ID biometric verification and Privy organization policy.</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Milestone Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Next.js Frontend & Payment Integration"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-full text-xs text-neutral-950 focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Deliverables Description</label>
            <textarea
              rows={3}
              required
              placeholder="Detail the technical requirements and acceptance criteria for milestone release..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-2xl text-xs text-neutral-950 focus:outline-none focus:border-black transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Escrow Amount (USDC)</label>
              <input
                type="number"
                required
                min="1"
                value={amountUsdc}
                onChange={(e) => setAmountUsdc(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-full text-xs text-neutral-950 focus:outline-none focus:border-black transition-colors font-mono"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">≥ $500 triggers World Selfie Check</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Freelancer Payout Address</label>
              <input
                type="text"
                required
                value={freelancerPayoutAddress}
                onChange={(e) => setFreelancerPayoutAddress(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-full text-xs text-neutral-950 focus:outline-none focus:border-black transition-colors font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-neutral-300 hover:border-black text-neutral-700 hover:text-black rounded-full text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-black hover:bg-neutral-800 disabled:bg-neutral-300 text-white rounded-full text-xs font-bold transition-all shadow-sm"
            >
              {loading ? 'Creating milestone...' : 'Create Escrow Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
