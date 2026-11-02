import { absoluteUrl } from '@/lib/seo';

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/account', '/checkout', '/cart', '/login', '/register'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
