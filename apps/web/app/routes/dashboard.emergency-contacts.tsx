import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { useLoaderData, Form, useActionData, redirect } from 'react-router';
import { useState } from 'react';
import { requireUserId, getUser } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';
export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  const user = await getUser(request);

  if (!user) {
    throw new Response('Not Found', { status: 404 });
  }

  // Get existing emergency contacts
  const { data: contacts } = await supabaseAdmin
    .from('emergency_contacts')
    .select('*')
    .eq('participant_id', user.id)
    .order('created_at', { ascending: true });

  return { user, contacts: contacts || [] };
}

export async function action({ request }: ActionFunctionArgs) {
  await requireUserId(request);
  const user = await getUser(request);

  if (!user) {
    throw new Response('Not Found', { status: 404 });
  }

  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'add') {
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const relationship = formData.get('relationship') as string;

    if (!name || !phone) {
      return { error: 'Naam en telefoonnummer zijn verplicht' };
    }

    const { error } = await supabaseAdmin
      .from('emergency_contacts')
      .insert({
        participant_id: user.id,
        name,
        phone,
        relationship: relationship || null,
      });

    if (error) {
      return { error: 'Fout bij toevoegen contact' };
    }

    return { success: 'Contact succesvol toegevoegd' };
  }

  if (intent === 'delete') {
    const contactId = formData.get('contactId') as string;

    const { error } = await supabaseAdmin
      .from('emergency_contacts')
      .delete()
      .eq('id', contactId)
      .eq('participant_id', user.id);

    if (error) {
      return { error: 'Fout bij verwijderen contact' };
    }

    return { success: 'Contact succesvol verwijderd' };
  }

  return null;
}

export default function EmergencyContacts() {
  const { user, contacts } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="relative bg-gradient-to-br from-red-900 via-red-600 to-red-400 text-white py-16 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-md rounded-full">
              <Icon name="phone" className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">Noodcontacten</h1>
              <p className="text-xl text-red-100 mt-1">
                Voor noodsituaties tijdens het event
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <Icon name="info" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Waarom noodcontacten?</p>
              <p>
                In geval van een noodsituatie tijdens het event kunnen organisatoren deze personen contacteren. 
                We raden aan minimaal 1 contact toe te voegen.
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {actionData?.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <Icon name="alert-triangle" className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{actionData.error}</p>
            </div>
          </div>
        )}

        {actionData?.success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <Icon name="check-circle" className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800">{actionData.success}</p>
            </div>
          </div>
        )}

        {/* Existing Contacts */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Mijn Noodcontacten</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Icon name="plus" className="w-4 h-4" />
              Contact Toevoegen
            </button>
          </div>

          {contacts.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="phone" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Nog geen noodcontacten toegevoegd</p>
              <button
                onClick={() => setShowForm(true)}
                className="text-red-600 hover:text-red-700 font-semibold"
              >
                Voeg je eerste contact toe →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact: any) => (
                <div key={contact.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{contact.name}</h3>
                      {contact.relationship && (
                        <p className="text-sm text-gray-600 mb-2">{contact.relationship}</p>
                      )}
                      <div className="flex items-center gap-2 text-gray-700">
                        <Icon name="phone" className="w-4 h-4" />
                        <a href={`tel:${contact.phone}`} className="hover:text-red-600">
                          {contact.phone}
                        </a>
                      </div>
                    </div>
                    <Form method="post">
                      <input type="hidden" name="intent" value="delete" />
                      <input type="hidden" name="contactId" value={contact.id} />
                      <button
                        type="submit"
                        className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-white hover:bg-red-600 border border-red-600 rounded-lg transition-colors"
                        onClick={(e) => {
                          if (!confirm('Weet je zeker dat je dit contact wilt verwijderen?')) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <Icon name="trash-2" className="w-4 h-4" />
                        <span className="text-sm font-medium">Verwijder</span>
                      </button>
                    </Form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Contact Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Nieuw Contact</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Icon name="x" className="w-6 h-6" />
              </button>
            </div>

            <Form method="post" onSubmit={() => setShowForm(false)}>
              <input type="hidden" name="intent" value="add" />

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
                    Naam *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Volledige naam"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1">
                    Telefoonnummer *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="+32 xxx xx xx xx"
                  />
                </div>

                <div>
                  <label htmlFor="relationship" className="block text-sm font-semibold text-gray-700 mb-1">
                    Relatie (optioneel)
                  </label>
                  <input
                    type="text"
                    id="relationship"
                    name="relationship"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Bijv. Partner, Ouder, Vriend"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold"
                  >
                    Contact Opslaan
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
}
