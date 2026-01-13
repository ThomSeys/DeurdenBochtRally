import type { LoaderFunctionArgs } from 'react-router';
import { sanityClient } from '~/lib/sanity.server';

export async function loader({ request }: LoaderFunctionArgs) {
  // Return JSON to be cached by service worker
  const rallyZones = await sanityClient.fetch(`
    *[_type == "rallyZone"] | order(order asc) {
      _id,
      title,
      location,
      color,
      startLocation,
      endLocation,
      "is_open": coalesce(is_open, true),
      gpxRoute {
        asset-> {
          url
        }
      }
    }
  `);

  return new Response(JSON.stringify(rallyZones), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // 1 hour browser cache
    },
  });
}
