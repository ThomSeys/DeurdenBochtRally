import type { LoaderFunctionArgs } from 'react-router';
import { sanityClient } from '~/lib/sanity.server';

export async function loader({ params }: LoaderFunctionArgs) {
  const { zoneId } = params;

  if (!zoneId) {
    return new Response(
      JSON.stringify({ content: null }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, no-cache',
        },
      }
    );
  }

  try {
    // Fetch zone data from Sanity
    const zone = await sanityClient.fetch(
      `*[_type == "rallyZone" && order == $order][0] {
        gpxRoute {
          asset-> {
            url
          }
        }
      }`,
      { order: parseInt(zoneId) }
    );

    const gpxUrl = zone?.gpxRoute?.asset?.url;

    if (!gpxUrl) {
      return new Response(
        JSON.stringify({ content: null }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=86400',
          },
        }
      );
    }

    // Fetch the GPX file from Sanity CDN server-side (no CORS issues)
    const gpxResponse = await fetch(gpxUrl);
    
    if (!gpxResponse.ok) {
      console.error('Failed to fetch zone GPX file:', gpxResponse.status);
      return new Response(
        JSON.stringify({ content: null }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=86400',
          },
        }
      );
    }

    const gpxContent = await gpxResponse.text();

    return new Response(
      JSON.stringify({ content: gpxContent }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400', // 24 hours
        },
      }
    );
  } catch (error) {
    console.error('Error fetching zone GPX:', error);
    return new Response(
      JSON.stringify({ content: null }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, no-cache',
        },
      }
    );
  }
}
