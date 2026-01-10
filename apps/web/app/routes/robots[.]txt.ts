import type { LoaderFunctionArgs } from '@remix-run/node';
import { getSiteConfig } from '~/lib/sanity.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const config = await getSiteConfig();
  const host = new URL(request.url).origin;
  
  // If noIndex is enabled, disallow all crawling
  if (config?.noIndex) {
    return new Response(
      `User-agent: *
Disallow: /

# This site is currently not ready for search engine indexing.
# Check back later when we're ready to launch!`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'public, max-age=3600',
        },
      }
    );
  }
  
  // Default robots.txt when indexing is allowed
  return new Response(
    `User-agent: *
Allow: /

Sitemap: ${host}/sitemap.xml`,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600',
      },
    }
  );
}
