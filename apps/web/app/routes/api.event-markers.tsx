import type { LoaderFunctionArgs } from 'react-router';
import { sanityClient } from '~/lib/sanity.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const eventMarkers = await sanityClient.fetch(`
    *[_type == "eventMarker" && isActive == true] | order(createdAt desc) {
      _id,
      title,
      description,
      type,
      location,
      severity,
      createdAt,
      updatedAt
    }
  `);

  return new Response(JSON.stringify(eventMarkers || []), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300', // 5 minutes
    },
  });
}
