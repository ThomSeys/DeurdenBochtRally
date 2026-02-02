import type { LoaderFunctionArgs } from 'react-router';
import { supabase } from '~/lib/supabase.server';
import { createRequestLogger } from '~/lib/logger.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const requestLogger = createRequestLogger(request);
  
  await requestLogger.info('api-call', 'Documents API called');
  
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
