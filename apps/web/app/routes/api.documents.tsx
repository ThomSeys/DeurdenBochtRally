import type { LoaderFunctionArgs } from 'react-router';
import { supabase } from '~/lib/supabase.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .order('category', { ascending: true });

  return new Response(JSON.stringify(documents || []), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400', // 24 hours
    },
  });
}
