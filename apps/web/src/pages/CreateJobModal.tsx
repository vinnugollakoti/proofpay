import React, { useState } from 'react';
import { createJob } from '../services/api.js';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h2 className="text-base font-bold text-white">Create New Escrow Job</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1 font-medium">Job Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Audit Smart Contracts for DeFi App"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-medium">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specify requirements and deliverables..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-medium">
                Escrow Amount (USDC)
              </label>
              <input
                type="number"
                required
                min="1"
                value={amountUsdc}
                onChange={(e) => setAmountUsdc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">≥ 500 USDC triggers World Selfie Check</p>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Settlement Chain</label>
              <input
                type="text"
                disabled
                value="Arc Testnet (5042002)"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-400 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-medium">Freelancer Payout Address</label>
            <input
              type="text"
              required
              value={freelancerPayoutAddress}
              onChange={(e) => setFreelancerPayoutAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 text-slate-950 font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
