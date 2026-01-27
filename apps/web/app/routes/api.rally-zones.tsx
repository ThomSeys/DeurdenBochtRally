import type { LoaderFunctionArgs } from 'react-router';
import { sanityClient } from '~/lib/sanity.server';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Return JSON to be cached by service worker (Concept B: QR check-in zones)
    const rallyZones = await sanityClient.fetch(`
      *[_type == "rallyZone"] | order(order asc) {
        zoneType,
        estimatedDistance,
        checkpoints[] {
          name,
          description,
          codeHint,
          solution,
          validAnswers,
          location
        },
        _id,
        title,
        order,
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

    return new Response(JSON.stringify(rallyZones || []), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // 1 hour browser cache
      },
    });
  } catch (error) {
    console.error('[API] Error fetching rally zones:', error);
    // Return empty array on error so the map can still render
    return new Response(JSON.stringify([]), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, no-cache',
      },
    });
  }
}
