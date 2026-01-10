import type { LoaderFunctionArgs } from '@remix-run/node';
import { getSiteConfig } from '~/lib/sanity.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const config = await getSiteConfig();
  const host = new URL(request.url).origin;
  
  // Don't generate sitemap if noIndex is enabled
  if (config?.noIndex) {
    return new Response('Sitemap not available while site is in noindex mode', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
  
  const routes = [
    '',
    '/about',
    '/rally',
    '/registration',
    '/login',
  ];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(route => `  <url>
    <loc>${host}${route}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;
  
  return new Response(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
