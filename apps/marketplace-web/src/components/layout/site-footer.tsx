import Link from 'next/link';

import { FOOTER_COLUMNS } from '@/lib/nav-config';

import { Logo } from './logo';

export function SiteFooter() {
  return (
    <footer className="bg-muted/40 mt-24 border-t">
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
          <p>Demo build: all data is mocked and no payments are processed.</p>
        </div>
      </div>
    </footer>
  );
}
