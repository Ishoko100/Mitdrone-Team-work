'use client';

import Link from 'next/link';

import type { ComponentProps } from 'react';

/** Client-side navigation for internal links, plain anchors for other origins (e.g. the vendor app). */
export function NavLink({ href, children, ...props }: ComponentProps<'a'> & { href: string }) {
  if (/^https?:\/\//.test(href)) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
}
