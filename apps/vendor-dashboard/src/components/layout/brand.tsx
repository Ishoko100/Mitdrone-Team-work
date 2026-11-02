import Link from 'next/link';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/dashboard"
      aria-label="Mitdrone Seller Hub"
      className="inline-flex items-center gap-2 font-semibold tracking-tight"
    >
      <svg viewBox="0 0 32 32" className="text-primary size-7" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="currentColor" />
        <g stroke="white" strokeWidth="2" strokeLinecap="round" fill="none">
          <path d="M16 16 L8 9 M16 16 L24 9 M16 16 L8 23 M16 16 L24 23" />
        </g>
        <circle cx="16" cy="16" r="3" fill="white" />
      </svg>
      {compact ? null : (
        <span className="text-lg">
          Mitdrone <span className="text-muted-foreground font-normal">Seller Hub</span>
        </span>
      )}
    </Link>
  );
}
