import React from 'react';
import { AuditEvent } from '../types/index';
import { ArcAddress } from './ArcAddress';
import { CheckCircle2, Clock, AlertTriangle, ShieldCheck, ArrowUpRight, ExternalLink } from 'lucide-react';

interface AuditTimelineProps {
  events: AuditEvent[];
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ events }) => {
  return (
    <div className="bg-white border border-neutral-200 rounded-3xl p-8 shadow-xs">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100">
        <h3 className="text-sm font-bold text-neutral-950 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-black" />
          Cryptographic Audit Trail
        </h3>
        <span className="text-xs text-neutral-500 font-mono">{events.length} Events Logged</span>
      </div>

      <div className="space-y-4">
        {events.length === 0 ? (
          <p className="text-xs text-neutral-400 italic">No audit events recorded yet.</p>
        ) : (
          events.map((event, idx) => {
            const isSuccess =
              event.eventType.includes('RELEASED') ||
              event.eventType.includes('COMPLETED') ||
              event.eventType.includes('VERIFIED');
            const isBlocked =
              event.eventType.includes('BLOCKED') || event.eventType.includes('FAILED');

            return (
              <div
                key={event.id || idx}
                className="relative pl-6 pb-4 border-l border-neutral-200 last:border-0 last:pb-0"
              >
                <div className="absolute -left-1.5 top-1 bg-white">
                  <span
                    className={`block h-3 w-3 rounded-full border-2 ${
                      isSuccess
                        ? 'border-black bg-black'
                        : isBlocked
                        ? 'border-neutral-900 bg-white'
                        : 'border-neutral-400 bg-white'
                    }`}
                  ></span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-neutral-950">
                    {event.eventType.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="mt-1.5 text-xs text-neutral-600 bg-neutral-50 p-3 rounded-2xl border border-neutral-200 font-mono">
                  {event.actorRole && (
                    <div className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <span>Actor: <strong className="text-neutral-900 font-semibold">{event.actorRole}</strong></span>
                      {event.actorAddress && (
                        <span>
                          (<ArcAddress address={event.actorAddress} className="text-neutral-600 font-normal" />)
                        </span>
                      )}
                    </div>
                  )}

                  {event.metadata && (
                    <div className="text-[11px] text-neutral-700 break-all space-y-0.5">
                      {Object.entries(event.metadata).map(([k, v]) => {
                        const isAddress =
                          typeof v === 'string' && v.startsWith('0x') && v.length === 42;
                        const isTx =
                          k.toLowerCase().includes('txhash') &&
                          typeof v === 'string' &&
                          v.startsWith('0x');

                        return (
                          <div key={k} className="flex items-center gap-1 flex-wrap">
                            <span className="text-neutral-400">{k}:</span>{' '}
                            {isAddress ? (
                              <ArcAddress address={v as string} className="text-neutral-900 font-medium" />
                            ) : isTx ? (
                              <a
                                href={`https://testnet.arcscan.app/tx/${v}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-neutral-900 font-medium underline flex items-center gap-1"
                              >
                                {(v as string).slice(0, 10)}...{(v as string).slice(-6)}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-neutral-900 font-medium">
                                {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                              </span>
                            )}
                          </div>
                        );
                      })}
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
