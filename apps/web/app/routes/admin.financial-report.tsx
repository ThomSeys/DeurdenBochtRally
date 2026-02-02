import type { LoaderFunctionArgs, MetaFunction, ActionFunctionArgs } from 'react-router';
import { useLoaderData, Form, Link } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';
import { useState } from 'react';
import { createRequestLogger } from '~/lib/logger.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Financiële Rapportage - Admin - Deur Den Bocht' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireAdmin(request);
  const requestLogger = createRequestLogger(request, userId);
  
  await requestLogger.info('page-view', 'Admin financial report loaded');

  // Get all participants with payment info
  const { data: participants } = await supabaseAdmin
    .from('participants')
    .select('id, first_name, last_name, email, formula, payment_status, checked_in, created_at, amount_paid');

  // Calculate revenue by formula
  const revenueByFormula = {
    with_meals: { count: 0, revenue: 0, amount: 20 },
    breakfast_only: { count: 0, revenue: 0, amount: 10 },
  };

  const paymentStatusCounts = {
    completed: 0,
    pending: 0,
    failed: 0,
    refunded: 0,
  };

  let totalRevenue = 0;
  let noShowCount = 0;

  participants?.forEach((p: any) => {
    // Count by payment status
    if (p.payment_status) {
      paymentStatusCounts[p.payment_status as keyof typeof paymentStatusCounts] = 
        (paymentStatusCounts[p.payment_status as keyof typeof paymentStatusCounts] || 0) + 1;
    }

    // Calculate revenue for completed payments
    if (p.payment_status === 'completed') {
      const amount = p.amount_paid || (p.formula === 'with_meals' ? 20 : 10);
      
      totalRevenue += amount;

      if (p.formula === 'with_meals') {
        revenueByFormula.with_meals.count++;
        revenueByFormula.with_meals.revenue += amount;
      } else {
        revenueByFormula.breakfast_only.count++;
        revenueByFormula.breakfast_only.revenue += amount;
      }

      // Check for no-shows (paid but didn't check in)
      if (!p.checked_in) {
        noShowCount++;
      }
    }
  });

  // Get recent transactions
  const { data: recentTransactions } = await supabaseAdmin
    .from('participants')
    .select('id, first_name, last_name, formula, payment_status, created_at, amount_paid')
    .order('created_at', { ascending: false })
    .limit(20);

  return {
    revenueByFormula,
    paymentStatusCounts,
    totalRevenue,
    noShowCount,
    totalParticipants: participants?.length || 0,
    recentTransactions: recentTransactions || [],
  };
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);

  const formData = await request.formData();
  const action = formData.get('action');

  if (action === 'export') {
    // Export functionality would be implemented here
    // For now, return success
    return { success: true, message: 'Export gestart (implementatie volgt)' };
  }

  return { success: false, message: 'Onbekende actie' };
}

export default function AdminFinancialReport() {
  const { 
    revenueByFormula, 
    paymentStatusCounts, 
    totalRevenue, 
    noShowCount,
    totalParticipants,
    recentTransactions 
  } = useLoaderData<typeof loader>();

  const [showExportModal, setShowExportModal] = useState(false);

  const exportToCSV = () => {
    // Create CSV content
    const headers = ['Naam', 'Email', 'Formule', 'Betaalstatus', 'Bedrag', 'Datum'].join(',');
    const rows = recentTransactions.map((t: any) => {
      const amount = t.amount_paid ? t.amount_paid.toFixed(2) : 
        (t.formula === 'with_meals' ? '20.00' : '10.00');
      return [
        `${t.first_name} ${t.last_name}`,
        t.email || '',
        t.formula === 'with_meals' ? 'Met maaltijden' : 'Alleen ontbijt',
        t.payment_status,
        `€${amount}`,
        new Date(t.created_at).toLocaleDateString('nl-BE')
      ].join(',');
    });

    const csv = [headers, ...rows].join('\n');
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financieel-rapport-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="relative bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 text-white py-16 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-md rounded-full">
                  <Icon name="dollar-sign" className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold">Financiële Rapportage</h1>
                  <p className="text-xl text-green-100 mt-1">Inkomsten & Betalingen Overzicht</p>
                </div>
              </div>
            </div>
            <button
              onClick={exportToCSV}
              className="px-6 py-3 bg-white text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors flex items-center gap-2"
            >
              <Icon name="download" className="w-5 h-5" />
              Export naar CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back button */}
        <div className="mb-6">
          <Link
            to="/admin"
            className="inline-flex items-center text-primary-600 hover:text-primary-700"
          >
            <Icon name="arrow-left" className="w-4 h-4 mr-2" />
            Terug naar Admin Dashboard
          </Link>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-lg mb-2">Totale Inkomsten</p>
              <p className="text-5xl font-bold">€{totalRevenue.toFixed(2)}</p>
              <p className="text-green-100 mt-2">{totalParticipants} totaal deelnemers</p>
            </div>
            <div className="bg-white/20 backdrop-blur-md rounded-full p-6">
              <Icon name="trending-up" className="w-12 h-12" />
            </div>
          </div>
        </div>

        {/* Payment Status Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 rounded-full p-3">
                <Icon name="check-circle" className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-green-600">{paymentStatusCounts.completed}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Voltooid</h3>
            <p className="text-xs text-gray-500 mt-1">Succesvolle betalingen</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-100 rounded-full p-3">
                <Icon name="clock" className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-2xl font-bold text-yellow-600">{paymentStatusCounts.pending}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">In behandeling</h3>
            <p className="text-xs text-gray-500 mt-1">Wachtend op bevestiging</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-100 rounded-full p-3">
                <Icon name="x-circle" className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-2xl font-bold text-red-600">{paymentStatusCounts.failed}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Mislukt</h3>
            <p className="text-xs text-gray-500 mt-1">Niet geslaagde betalingen</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 rounded-full p-3">
                <Icon name="rotate-ccw" className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-purple-600">{paymentStatusCounts.refunded}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Terugbetaald</h3>
            <p className="text-xs text-gray-500 mt-1">Geannuleerde registraties</p>
          </div>
        </div>

        {/* Revenue by Formula */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Icon name="package" className="w-5 h-5 mr-2 text-blue-600" />
              Inkomsten per Formule
            </h2>
            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Met Maaltijden (€20)</h3>
                  <span className="text-2xl font-bold text-blue-600">
                    €{revenueByFormula.with_meals.revenue.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{revenueByFormula.with_meals.count} deelnemers</span>
                  <span>
                    {totalParticipants > 0 
                      ? ((revenueByFormula.with_meals.count / totalParticipants) * 100).toFixed(0)
                      : 0}% van totaal
                  </span>
                </div>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Alleen Ontbijt (€10)</h3>
                  <span className="text-2xl font-bold text-green-600">
                    €{revenueByFormula.breakfast_only.revenue.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{revenueByFormula.breakfast_only.count} deelnemers</span>
                  <span>
                    {totalParticipants > 0 
                      ? ((revenueByFormula.breakfast_only.count / totalParticipants) * 100).toFixed(0)
                      : 0}% van totaal
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* No-Show Tracking */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Icon name="user-x" className="w-5 h-5 mr-2 text-orange-600" />
              No-Show Tracking
            </h2>
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-orange-100 rounded-full mb-4">
                <span className="text-4xl font-bold text-orange-600">{noShowCount}</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Niet Komen Opdagen</h3>
              <p className="text-gray-600 mb-4">
                Deelnemers die betaald hebben maar niet zijn ingecheckt
              </p>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-orange-800">
                  <span className="font-semibold">Gemist inkomen impact:</span> 
                  {' '}Dit zijn betalingen die wel ontvangen zijn
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Icon name="list" className="w-5 h-5 mr-2 text-purple-600" />
            Recente Transacties
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deelnemer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Formule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bedrag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentTransactions.map((transaction: any) => {
                  const amount = transaction.amount_paid 
                    ? transaction.amount_paid.toFixed(2)
                    : (transaction.formula === 'with_meals' ? '20.00' : '10.00');

                  return (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.first_name} {transaction.last_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {transaction.formula === 'with_meals' ? 'Met maaltijden' : 'Alleen ontbijt'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">€{amount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.payment_status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : transaction.payment_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : transaction.payment_status === 'refunded'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.payment_status === 'completed' && 'Voltooid'}
                          {transaction.payment_status === 'pending' && 'In behandeling'}
                          {transaction.payment_status === 'refunded' && 'Terugbetaald'}
                          {transaction.payment_status === 'failed' && 'Mislukt'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString('nl-BE', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          to={`/admin/participants?id=${transaction.id}`}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Bekijk
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
