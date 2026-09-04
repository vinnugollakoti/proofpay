import React, { useState } from 'react';
import { ExternalLink, KeyRound, Copy, Check } from 'lucide-react';

interface ArcAddressProps {
  address: string;
  label?: string;
  truncate?: boolean;
  className?: string;
  showIcon?: boolean;
  showPrivyBadge?: boolean;
}

export const ArcAddress: React.FC<ArcAddressProps> = ({
  address,
  label,
  truncate = true,
  className = '',
  showIcon = true,
  showPrivyBadge = false,
}) => {
  const [copied, setCopied] = useState(false);

  if (!address) return null;

  const display =
    label ||
    (truncate && address.length > 12
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : address);

  const explorerUrl = `https://testnet.arcscan.app/address/${address}`;

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <a
        href={explorerUrl}
        target="_blank"
        rel="noreferrer"
        title={`View on ArcScan: ${address}`}
        className="inline-flex items-center gap-1 font-mono hover:underline hover:text-black transition-colors"
      >
        <span>{display}</span>
        {showIcon && <ExternalLink className="h-3 w-3 opacity-60 hover:opacity-100 shrink-0" />}
      </a>

      <button
        onClick={handleCopy}
        title="Copy address"
        className="opacity-50 hover:opacity-100 transition-opacity p-0.5 text-neutral-500 hover:text-black"
      >
        {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-2.5 w-2.5" />}
      </button>

      {showPrivyBadge && (
        <a
          href="https://dashboard.privy.io"
          target="_blank"
          rel="noreferrer"
          title="Managed via Privy Organization & Embedded Wallets"
          className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-[10px] font-sans font-medium text-neutral-700 transition-colors"
        >
          <KeyRound className="h-2.5 w-2.5 text-neutral-600" />
          <span>Privy</span>
        </a>
      )}
    </span>
  );
};
