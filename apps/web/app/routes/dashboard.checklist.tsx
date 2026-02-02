import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { useLoaderData, Form, useActionData } from 'react-router';
import { useState } from 'react';
import { requireUserId, getUser } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';
import { createRequestLogger } from '~/lib/logger.server';

// Standard checklist items for all participants
const DEFAULT_CHECKLIST_ITEMS = [
  { title: 'Motor technisch nagekeken', category: 'pre_event' },
  { title: 'Banden opgepompt', category: 'pre_event' },
  { title: 'Tank vol getankt', category: 'pre_event' },
  { title: 'Helm en handschoenen ingepakt', category: 'pre_event' },
  { title: 'Regenkleding ingepakt', category: 'pre_event' },
  { title: 'Telefoon opgeladen', category: 'pre_event' },
  { title: 'Roadbook gedownload', category: 'pre_event' },
  { title: 'QR code gedownload of geprint', category: 'pre_event' },
  { title: 'Noodcontacten ingevuld', category: 'pre_event' },
  { title: 'Ingeschreven bij startlocatie', category: 'event_day' },
  { title: 'Ontbijt genoten', category: 'event_day' },
  { title: 'Route gestart', category: 'event_day' },
  { title: 'Eerste rally zone bereikt', category: 'event_day' },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const requestLogger = createRequestLogger(request, userId);
  
  await requestLogger.info('page-view', 'Dashboard checklist loaded');
  
  const user = await getUser(request);

  if (!user) {
    throw new Response('Not Found', { status: 404 });
  }

  // Get user's custom checklist items
  const { data: customItems } = await supabaseAdmin
    .from('event_checklist_items')
    .select('*')
    .eq('participant_id', user.id)
    .order('created_at', { ascending: true });

  // Get completed tasks (from event_tasks table)
  const { data: completedTasks } = await supabaseAdmin
    .from('event_tasks')
    .select('title')
    .eq('assigned_to', user.id)
    .eq('completed', true);

  const completedTaskNames = new Set(completedTasks?.map(t => t.title) || []);

  // Merge default items with completion status
  const checklistItems = DEFAULT_CHECKLIST_ITEMS.map(item => ({
    ...item,
    isDefault: true,
    completed: completedTaskNames.has(item.title),
  }));

  // Add custom items
  const customChecklistItems = (customItems || []).map(item => ({
    id: item.id,
    title: item.title,
    category: item.category,
    isDefault: false,
    completed: completedTaskNames.has(item.title),
  }));

  return { 
    user, 
    checklistItems: [...checklistItems, ...customChecklistItems],
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const requestLogger = createRequestLogger(request, userId);
  
  const user = await getUser(request);

  if (!user) {
    throw new Response('Not Found', { status: 404 });
  }

  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'toggle') {
    const taskName = formData.get('taskName') as string;
    const completed = formData.get('completed') === 'true';

    if (completed) {
      // Uncheck - delete from event_tasks
      await supabaseAdmin
        .from('event_tasks')
        .delete()
        .eq('assigned_to', user.id)
        .eq('title', taskName);
    } else {
      // Check - insert into event_tasks
      await supabaseAdmin
        .from('event_tasks')
        .insert({
          assigned_to: user.id,
          title: taskName,
          completed: true,
          priority: 'medium',
        });
    }

    return { success: true };
  }

  if (intent === 'add') {
    const title = formData.get('title') as string;
    const category = formData.get('category') as string;

    if (!title) {
      return { error: 'Titel is verplicht' };
    }

    const { error } = await supabaseAdmin
      .from('event_checklist_items')
      .insert({
        participant_id: user.id,
        title,
        category: category || 'pre_event',
      });

    if (error) {
      return { error: 'Fout bij toevoegen item' };
    }

    return { success: 'Item succesvol toegevoegd' };
  }

  if (intent === 'delete') {
    const itemId = formData.get('itemId') as string;

    const { error } = await supabaseAdmin
      .from('event_checklist_items')
      .delete()
      .eq('id', itemId)
      .eq('participant_id', user.id);

    if (error) {
      return { error: 'Fout bij verwijderen item' };
    }

    return { success: 'Item succesvol verwijderd' };
  }

  return null;
}

export default function ParticipantChecklist() {
  const { user, checklistItems } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [showForm, setShowForm] = useState(false);

  const preEventItems = checklistItems.filter((item: any) => item.category === 'pre_event');
  const eventDayItems = checklistItems.filter((item: any) => item.category === 'event_day');

  const preEventCompleted = preEventItems.filter((item: any) => item.completed).length;
  const eventDayCompleted = eventDayItems.filter((item: any) => item.completed).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="relative bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 text-white py-16 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-md rounded-full">
              <Icon name="check-square" className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">Mijn Checklist</h1>
              <p className="text-xl text-primary-100 mt-1">
                Bereid je voor op het event
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Voor het Event</h3>
              <span className="text-2xl font-bold text-primary-600">
                {preEventCompleted}/{preEventItems.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(preEventCompleted / preEventItems.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Event Dag</h3>
              <span className="text-2xl font-bold text-green-600">
                {eventDayCompleted}/{eventDayItems.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(eventDayCompleted / eventDayItems.length) * 100}%` }}
              />
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

        {actionData?.success && typeof actionData.success === 'string' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <Icon name="check-circle" className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800">{actionData.success}</p>
            </div>
          </div>
        )}

        {/* Pre-Event Checklist */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Voor het Event</h2>
          <div className="space-y-2">
            {preEventItems.map((item: any, index: number) => (
              <Form key={item.id || index} method="post" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <input type="hidden" name="intent" value="toggle" />
                <input type="hidden" name="taskName" value={item.title} />
                <input type="hidden" name="completed" value={item.completed.toString()} />
                <button
                  type="submit"
                  className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                    item.completed 
                      ? 'bg-primary-600 border-primary-600' 
                      : 'border-gray-300 hover:border-primary-400'
                  }`}
                >
                  {item.completed && (
                    <Icon name="check" className="w-4 h-4 text-white" />
                  )}
                </button>
                <span className={`flex-1 ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                  {item.title}
                </span>
                {!item.isDefault && (
                  <Form method="post">
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="itemId" value={item.id} />
                    <button
                      type="submit"
                      className="text-gray-400 hover:text-red-600"
                      onClick={(e) => {
                        if (!confirm('Weet je zeker dat je dit item wilt verwijderen?')) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <Icon name="x" className="w-4 h-4" />
                    </button>
                  </Form>
                )}
              </Form>
            ))}
          </div>
        </div>

        {/* Event Day Checklist */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Dag</h2>
          <div className="space-y-2">
            {eventDayItems.map((item: any, index: number) => (
              <Form key={item.id || index} method="post" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <input type="hidden" name="intent" value="toggle" />
                <input type="hidden" name="taskName" value={item.title} />
                <input type="hidden" name="completed" value={item.completed.toString()} />
                <button
                  type="submit"
                  className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                    item.completed 
                      ? 'bg-green-600 border-green-600' 
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                >
                  {item.completed && (
                    <Icon name="check" className="w-4 h-4 text-white" />
                  )}
                </button>
                <span className={`flex-1 ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                  {item.title}
                </span>
                {!item.isDefault && (
                  <Form method="post">
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="itemId" value={item.id} />
                    <button
                      type="submit"
                      className="text-gray-400 hover:text-red-600"
                      onClick={(e) => {
                        if (!confirm('Weet je zeker dat je dit item wilt verwijderen?')) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <Icon name="x" className="w-4 h-4" />
                    </button>
                  </Form>
                )}
              </Form>
            ))}
          </div>
        </div>

        {/* Add Custom Item */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 hover:bg-gray-50 transition-colors text-gray-600 hover:text-primary-600"
            >
              <Icon name="plus" className="w-5 h-5" />
              <span className="font-semibold">Eigen item toevoegen</span>
            </button>
          ) : (
            <Form method="post" onSubmit={() => setShowForm(false)}>
              <input type="hidden" name="intent" value="add" />
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-1">
                    Titel
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Bijv. Eerste hulp kit controleren"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-1">
                    Categorie
                  </label>
                  <select
                    id="category"
                    name="category"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="pre_event">Voor het Event</option>
                    <option value="event_day">Event Dag</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                  >
                    Item Toevoegen
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
          )}
        </div>
      </div>
    </div>
  );
}
