import Image from 'next/image';
import Link from 'next/link';

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Mitdrone home"
      className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className ?? ''}`}
    >
      <Image
        src="/apple-touch-icon.png"
        alt=""
        width={50}
        height={50}
        className="size-15 object-contain"
        priority
      />
      <span className="text-xl">Mitdrone</span>
    </Link>
  );
}
