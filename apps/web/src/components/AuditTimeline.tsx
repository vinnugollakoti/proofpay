import React from 'react';
import { AuditEvent } from '../types/index.js';
import { CheckCircle2, Clock, AlertTriangle, ShieldCheck, ArrowUpRight } from 'lucide-react';

interface AuditTimelineProps {
  events: AuditEvent[];
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ events }) => {
  const getEventBadge = (type: string) => {
    if (type.includes('RELEASED') || type.includes('COMPLETED') || type.includes('VERIFIED')) {
      return {
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
        bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      };
    }
    if (type.includes('BLOCKED') || type.includes('FAILED')) {
      return {
        icon: <AlertTriangle className="h-4 w-4 text-rose-400" />,
        bg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
      };
    }
    return {
      icon: <Clock className="h-4 w-4 text-cyan-400" />,
      bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
    };
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Cryptographic Audit Trail
        </h3>
        <span className="text-xs text-slate-400">{events.length} Recorded Events</span>
      </div>

      <div className="space-y-4">
        {events.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No audit events recorded yet.</p>
        ) : (
          events.map((event, idx) => {
            const badge = getEventBadge(event.eventType);
            return (
              <div key={event.id || idx} className="relative pl-6 pb-2 border-l border-slate-800 last:border-0">
                <div className="absolute -left-2 top-0.5 bg-slate-950 p-0.5 rounded-full">
                  {badge.icon}
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-slate-200">
                    {event.eventType.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="mt-1 text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 font-mono">
                  {event.actorRole && (
                    <div className="text-[11px] text-slate-400 mb-1">
                      <span className="text-slate-500">Actor:</span>{' '}
                      <span className="text-indigo-300 font-semibold">{event.actorRole}</span>{' '}
                      {event.actorAddress && (
                        <span className="text-slate-500">({event.actorAddress.slice(0, 8)}...)</span>
                      )}
                    </div>
                  )}

                  {event.metadata.txHash && (
                    <div className="mt-1 flex items-center gap-1.5 text-emerald-400">
                      <span>Arc Tx:</span>
                      <a
                        href={`https://testnet.arcscan.app/tx/${event.metadata.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline hover:text-emerald-300 flex items-center gap-0.5"
                      >
                        {event.metadata.txHash.slice(0, 14)}...
                        <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {event.metadata.nullifierHash && (
                    <div className="text-cyan-400 text-[11px]">
                      World Nullifier: {event.metadata.nullifierHash.slice(0, 16)}...
                    </div>
                  )}

                  {event.metadata.reason && (
                    <div className="text-rose-400 text-[11px] mt-0.5">
                      ⚠️ {event.metadata.reason}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
