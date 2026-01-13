import type { LoaderFunctionArgs } from 'react-router';
import { sanityClient } from '~/lib/sanity.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const siteConfig = await sanityClient.fetch(`
    *[_type == "siteConfig"][0] {
      gpxRouteFile {
        asset-> {
          url
        }
      }
    }
  `);

  const gpxUrl = siteConfig?.gpxRouteFile?.asset?.url;

  return new Response(
    JSON.stringify({ url: gpxUrl || null }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400', // 24 hours
      },
    }
  );
}
