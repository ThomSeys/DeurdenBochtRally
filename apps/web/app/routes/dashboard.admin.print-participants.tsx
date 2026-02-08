import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { useEffect } from 'react';

interface Participant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  motorcycle_brand: string | null;
  motorcycle_model: string | null;
  emergency_contacts: Array<{
    id: string;
    name: string;
    phone: string;
    relationship: string | null;
  }>;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);

  // Get all participants with their emergency contacts
  const { data: participants, error } = await supabaseAdmin
    .from('participants')
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      motorcycle_brand,
      motorcycle_model,
      emergency_contacts (
        id,
        name,
        phone,
        relationship
      )
    `)
    .eq('role', 'participant')
    .order('last_name', { ascending: true });

  if (error) {
    throw new Response('Fout bij ophalen deelnemers', { status: 500 });
  }

  return { 
    participants: participants || [],
    generatedAt: new Date().toLocaleString('nl-BE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  };
}

export default function PrintParticipants() {
  const { participants, generatedAt } = useLoaderData<typeof loader>();

  useEffect(() => {
    // Auto-trigger print dialog after page loads
    const timeout = setTimeout(() => {
      window.print();
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="min-h-screen bg-white p-8 print:p-0">
      {/* Print Header */}
      <div className="mb-8 pb-4 border-b-2 border-gray-800 print:mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 print:text-2xl">
              🏍️ Deur den Bocht Rally 2026
            </h1>
            <h2 className="text-xl text-gray-700 mt-1 print:text-lg">
              Deelnemerslijst met Noodcontacten
            </h2>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p className="font-semibold">VZW Deur Den Bocht</p>
            <p>Datum: 8 augustus 2026</p>
            <p className="text-xs mt-1">Gegenereerd: {generatedAt}</p>
          </div>
        </div>
      </div>

      {/* No Print Button */}
      <div className="mb-6 print:hidden">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mr-3"
        >
          🖨️ Afdrukken
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          ← Terug
        </button>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 print:mb-4">
        <p className="text-lg font-semibold text-gray-800">
          Totaal aantal deelnemers: <span className="text-red-600">{participants.length}</span>
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Met noodcontacten: {participants.filter((p: Participant) => p.emergency_contacts?.length > 0).length} deelnemers
        </p>
      </div>

      {/* Participants List */}
      <div className="space-y-6 print:space-y-4">
        {participants.map((participant: Participant, index: number) => (
          <div 
            key={participant.id}
            className="border border-gray-300 rounded-lg p-4 print:p-3 print:break-inside-avoid"
          >
            {/* Participant Header */}
            <div className="flex justify-between items-start mb-3 pb-2 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-gray-900 print:text-base">
                  {index + 1}. {participant.first_name} {participant.last_name}
                </h3>
                {participant.motorcycle_brand && participant.motorcycle_model && (
                  <p className="text-sm text-gray-600 mt-0.5">
                    🏍️ {participant.motorcycle_brand} {participant.motorcycle_model}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4 mb-3 print:text-sm">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Email</p>
                <p className="text-gray-800">{participant.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Telefoon</p>
                <p className="text-gray-800">{participant.phone || 'Niet opgegeven'}</p>
              </div>
            </div>

            {/* Emergency Contacts */}
            {participant.emergency_contacts && participant.emergency_contacts.length > 0 ? (
              <div className="mt-3 pt-3 border-t border-gray-200 bg-red-50 -m-4 p-4 rounded-b-lg print:-m-3 print:p-3">
                <p className="text-xs text-red-700 uppercase font-bold mb-2 flex items-center gap-1">
                  <span>🚨</span> Noodcontacten
                </p>
                <div className="space-y-2">
                  {participant.emergency_contacts.map((contact) => (
                    <div key={contact.id} className="bg-white rounded p-2 print:text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">{contact.name}</p>
                          {contact.relationship && (
                            <p className="text-xs text-gray-600">{contact.relationship}</p>
                          )}
                        </div>
                        <p className="font-mono text-sm font-bold text-red-700">
                          {contact.phone}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-3 pt-3 border-t border-gray-200 bg-yellow-50 -m-4 p-4 rounded-b-lg print:-m-3 print:p-3">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ Geen noodcontacten opgegeven
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer for print */}
      <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
        <p>Deur den Bocht Rally 2026 - VZW Deur Den Bocht - Vertrouwelijk document</p>
        <p>Gegenereerd: {generatedAt}</p>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 2cm;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:block {
            display: block !important;
          }
          
          .print\\:break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
