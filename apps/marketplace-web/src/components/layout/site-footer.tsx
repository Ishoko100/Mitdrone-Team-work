import Link from 'next/link';

import { FOOTER_COLUMNS } from '@/lib/nav-config';

import { Logo } from './logo';

export function SiteFooter() {
  return (
    <footer className="marketplace-footer mt-24 border-t">
      <div className="container grid gap-10 py-12 lg:grid-cols-[1.2fr_3fr]">
        <div className="space-y-3">
          <Logo />
          <p className="text-muted-foreground max-w-xs text-sm">
            The secure marketplace to buy, sell, rent and discover verified drones, equipment and
            services.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h2 className="mb-3 text-sm font-semibold">{column.title}</h2>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t">
        <div className="text-muted-foreground container flex flex-col gap-2 py-5 text-xs sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Mitdrone. All rights reserved.</p>
          <nav aria-label="Social media" className="flex items-center gap-3">
            {[
              { name: 'Twitter', href: 'https://twitter.com/mitdrone' },
              { name: 'Facebook', href: 'https://facebook.com/mitdrone' },
              { name: 'Instagram', href: 'https://instagram.com/mitdrone' },
              { name: 'LinkedIn', href: 'https://linkedin.com/company/mitdrone' },
            ].map(({ name, href }) => (
              <a
                key={name}
                href={href}
                aria-label={`Mitdrone on ${name}`}
                title={`${name} profile placeholder`}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring flex size-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2"
              >
                <SocialIcon name={name} />
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ name }: { name: string }) {
  const common = {
    'aria-hidden': true as const,
    className: 'size-[18px] fill-current',
    viewBox: '0 0 24 24',
  };

  if (name === 'Twitter') {
    return (
      <svg {...common}>
        <path d="M23.953 4.57a10 10 0 0 1-2.825.775 4.932 4.932 0 0 0 2.163-2.723 9.99 9.99 0 0 1-3.127 1.195 4.916 4.916 0 0 0-8.384 4.482A13.95 13.95 0 0 1 1.64 2.162a4.916 4.916 0 0 0 1.522 6.557 4.9 4.9 0 0 1-2.228-.616v.062a4.918 4.918 0 0 0 3.946 4.817 4.93 4.93 0 0 1-2.22.084 4.92 4.92 0 0 0 4.59 3.414A9.87 9.87 0 0 1 0 18.54a13.93 13.93 0 0 0 7.548 2.213c9.057 0 14.01-7.504 14.01-14.01 0-.213-.005-.425-.014-.636a10.01 10.01 0 0 0 2.46-2.548z" />
      </svg>
    );
  }
  if (name === 'Facebook') {
    return (
      <svg {...common}>
        <path d="M13.5 21v-8.2h2.8l.42-3.2H13.5V7.56c0-.93.26-1.56 1.6-1.56h1.7V3.14c-.3-.04-1.34-.14-2.55-.14-2.53 0-4.25 1.54-4.25 4.38V9.6H7.15v3.2H10V21h3.5z" />
      </svg>
    );
  }
  if (name === 'Instagram') {
    return (
      <svg {...common}>
        <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm5.5-3a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.44c.98 0 1.79-.77 1.79-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}
