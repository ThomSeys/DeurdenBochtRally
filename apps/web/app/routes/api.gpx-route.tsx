import type { LoaderFunctionArgs } from 'react-router';
import { sanityClient } from '~/lib/sanity.server';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
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
      console.error('Failed to fetch GPX file:', gpxResponse.status);
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
    console.error('Error fetching GPX route:', error);
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
