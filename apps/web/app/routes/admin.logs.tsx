import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, useSearchParams, Form } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';

export const meta: MetaFunction = () => {
  return [
    { title: 'System Logs - Admin - Deur Den Bocht' },
  ];
};

interface SystemLog {
  id: number;
  created_at: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  category: string;
  message: string;
  user_id: string | null;
  participant_id: string | null;
  metadata: any;
  request_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  url: string | null;
  method: string | null;
  status_code: number | null;
  error_stack: string | null;
  duration_ms: number | null;
  participant?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);

  const url = new URL(request.url);
  const level = url.searchParams.get('level') || 'all';
  const category = url.searchParams.get('category') || 'all';
  const search = url.searchParams.get('search') || '';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = 50;
  const offset = (page - 1) * limit;

  // Build query
  let query = supabaseAdmin
    .from('system_logs')
    .select(`
      *,
      participant:participants(first_name, last_name, email)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply filters
  if (level !== 'all') {
    query = query.eq('level', level);
  }

  if (category !== 'all') {
    query = query.eq('category', category);
  }

  if (search) {
    query = query.or(`message.ilike.%${search}%,category.ilike.%${search}%`);
  }

  const { data: logs, error, count } = await query;

  if (error) {
    console.error('Error fetching logs:', error);
    throw new Error('Failed to load logs');
  }

  // Get all unique categories for filter
  const { data: categoriesData } = await supabaseAdmin
    .from('system_logs')
    .select('category')
    .order('category');

  const categories = [...new Set(categoriesData?.map(log => log.category) || [])];

  return {
    logs: logs as SystemLog[],
    categories,
    totalCount: count || 0,
    currentPage: page,
    totalPages: Math.ceil((count || 0) / limit),
    filters: { level, category, search },
  };
}

const levelColors = {
  debug: 'bg-gray-100 text-gray-800',
  info: 'bg-blue-100 text-blue-800',
  warn: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  critical: 'bg-red-200 text-red-900 font-bold',
};

const levelIcons = {
  debug: 'bug-ant',
  info: 'information-circle',
  warn: 'exclamation-triangle',
  error: 'x-circle',
  critical: 'fire',
};

export default function AdminLogs() {
  const { logs, categories, totalCount, currentPage, totalPages, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all' || value === '') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    newParams.delete('page'); // Reset to first page on filter change
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  return (
    <>
      <Header />
      <div className="relative bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 text-white py-16 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
            <Icon name="document-text" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">System Logs</h1>
          <p className="text-xl text-gray-200">Debug & monitoring</p>
        </div>
      </div>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Level Filter */}
              <div>
                <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-2">
                  Log Level
                </label>
                <select
                  id="level"
                  value={filters.level}
                  onChange={(e) => handleFilterChange('level', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                >
                  <option value="all">All Levels</option>
                  <option value="debug">Debug</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="md:col-span-2">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <Form method="get" className="relative">
                  <input
                    type="text"
                    id="search"
                    name="search"
                    defaultValue={filters.search}
                    placeholder="Search in message or category..."
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 pr-10"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <Icon name="magnifying-glass" className="h-5 w-5" />
                  </button>
                </Form>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <div>
                Showing {logs.length} of {totalCount} logs
              </div>
              {(filters.level !== 'all' || filters.category !== 'all' || filters.search) && (
                <button
                  onClick={() => setSearchParams({})}
                  className="text-amber-600 hover:text-amber-700 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No logs found
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <LogRow key={log.id} log={log} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function LogRow({ log }: { log: SystemLog }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <>
      <tr className={`hover:bg-gray-50 cursor-pointer ${expanded ? 'bg-gray-50' : ''}`}>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {new Date(log.created_at).toLocaleString('nl-BE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${levelColors[log.level]}`}>
            <Icon name={levelIcons[log.level]} className="h-4 w-4 mr-1" />
            {log.level}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          {log.category}
        </td>
        <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
          {log.message}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {log.participant ? (
            <div>
              <div className="font-medium text-gray-900">
                {log.participant.first_name} {log.participant.last_name}
              </div>
              <div className="text-gray-500 text-xs">{log.participant.email}</div>
            </div>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-amber-600 hover:text-amber-700"
          >
            {expanded ? 'Hide' : 'Show'}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan={6} className="px-6 py-4">
            <div className="space-y-3 text-sm">
              {/* Request Info */}
              {(log.url || log.method || log.ip_address) && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Request Information</h4>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {log.method && log.url && (
                      <div>
                        <dt className="text-gray-500">Request</dt>
                        <dd className="text-gray-900 font-mono text-xs">
                          {log.method} {log.url}
                        </dd>
                      </div>
                    )}
                    {log.ip_address && (
                      <div>
                        <dt className="text-gray-500">IP Address</dt>
                        <dd className="text-gray-900 font-mono text-xs">{log.ip_address}</dd>
                      </div>
                    )}
                    {log.status_code && (
                      <div>
                        <dt className="text-gray-500">Status Code</dt>
                        <dd className="text-gray-900">{log.status_code}</dd>
                      </div>
                    )}
                    {log.duration_ms !== null && (
                      <div>
                        <dt className="text-gray-500">Duration</dt>
                        <dd className="text-gray-900">{log.duration_ms}ms</dd>
                      </div>
                    )}
                    {log.request_id && (
                      <div className="col-span-2">
                        <dt className="text-gray-500">Request ID</dt>
                        <dd className="text-gray-900 font-mono text-xs">{log.request_id}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* Metadata */}
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Metadata</h4>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded-md overflow-x-auto text-xs">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Error Stack */}
              {log.error_stack && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Error Stack Trace</h4>
                  <pre className="bg-red-50 text-red-900 p-3 rounded-md overflow-x-auto text-xs border border-red-200">
                    {log.error_stack}
                  </pre>
                </div>
              )}

              {/* User Agent */}
              {log.user_agent && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">User Agent</h4>
                  <p className="text-gray-700 font-mono text-xs">{log.user_agent}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// Import React for useState
import React from 'react';
