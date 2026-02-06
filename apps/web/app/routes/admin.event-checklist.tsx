import type { LoaderFunctionArgs, MetaFunction, ActionFunctionArgs } from 'react-router';
import { useLoaderData, Form, useActionData, useNavigation } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';
import { useState } from 'react';
import { Link } from 'react-router';
import { createRequestLogger } from '~/lib/logger.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Event Checklist - Admin - Deur Den Bocht' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireAdmin(request);
  const requestLogger = createRequestLogger(request, userId);
  
  await requestLogger.info('page-view', 'Admin event checklist page loaded');

  // Get checklist items
  const { data: checklistItems } = await supabaseAdmin
    .from('event_checklist_items')
    .select('*')
    .order('category', { ascending: true })
    .order('created_at', { ascending: true });

  // Get event tasks
  const { data: eventTasks } = await supabaseAdmin
    .from('event_tasks')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true });

  return {
    checklistItems: checklistItems || [],
    eventTasks: eventTasks || [],
  };
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);

  const formData = await request.formData();
  const action = formData.get('action');

  try {
    if (action === 'toggle_checklist') {
      const itemId = formData.get('itemId') as string;
      const completed = formData.get('completed') === 'true';

      const { error } = await supabaseAdmin
        .from('event_checklist_items')
        .update({ 
          completed: !completed,
          completed_at: !completed ? new Date().toISOString() : null,
        })
        .eq('id', itemId);

      if (error) throw error;
      return { success: true, message: 'Checklist item bijgewerkt' };
    }

    if (action === 'add_checklist_item') {
      const title = formData.get('title') as string;
      const category = formData.get('category') as string;

      const { error } = await supabaseAdmin
        .from('event_checklist_items')
        .insert({ title, category, completed: false });

      if (error) throw error;
      return { success: true, message: 'Checklist item toegevoegd' };
    }

    if (action === 'delete_checklist_item') {
      const itemId = formData.get('itemId') as string;

      const { error } = await supabaseAdmin
        .from('event_checklist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      return { success: true, message: 'Checklist item verwijderd' };
    }

    if (action === 'update_task') {
      const taskId = formData.get('taskId') as string;
      const status = formData.get('status') as string;

      const { error } = await supabaseAdmin
        .from('event_tasks')
        .update({ 
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
        })
        .eq('id', taskId);

      if (error) throw error;
      return { success: true, message: 'Taak status bijgewerkt' };
    }

    if (action === 'add_task') {
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const priority = formData.get('priority') as string;
      const assignedTo = formData.get('assignedTo') as string;

      const { error } = await supabaseAdmin
        .from('event_tasks')
        .insert({ 
          title, 
          description, 
          priority, 
          assigned_to: assignedTo || null,
          status: 'pending' 
        });

      if (error) throw error;
      return { success: true, message: 'Taak toegevoegd' };
    }

    if (action === 'delete_task') {
      const taskId = formData.get('taskId') as string;

      const { error } = await supabaseAdmin
        .from('event_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      return { success: true, message: 'Taak verwijderd' };
    }

    return { success: false, message: 'Onbekende actie' };
  } catch (error) {
    console.error('Action error:', error);
    return { success: false, message: 'Er is een fout opgetreden' };
  }
}

export default function EventChecklist() {
  const { checklistItems, eventTasks } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const [showAddChecklistItem, setShowAddChecklistItem] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);

  // Group checklist items by category
  const checklistByCategory = checklistItems.reduce((acc: any, item: any) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  // Calculate checklist progress
  const totalItems = checklistItems.length;
  const completedItems = checklistItems.filter((item: any) => item.completed).length;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  // Group tasks by status
  const pendingTasks = eventTasks.filter((task: any) => task.status === 'pending');
  const inProgressTasks = eventTasks.filter((task: any) => task.status === 'in_progress');
  const completedTasks = eventTasks.filter((task: any) => task.status === 'completed');
  const urgentTasks = eventTasks.filter((task: any) => task.priority === 'urgent' && task.status !== 'completed');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="relative bg-gradient-to-br from-purple-900 via-purple-600 to-purple-400 text-white py-16 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-md rounded-full">
                  <Icon name="check-square" className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold">Event Checklist</h1>
                  <p className="text-xl text-purple-100 mt-1">Voorbereiding & Taakbeheer</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-purple-200 mb-1">Voortgang</div>
              <div className="text-5xl font-bold">{progress.toFixed(0)}%</div>
              <div className="text-sm text-purple-200 mt-1">
                {completedItems} / {totalItems} voltooid
              </div>
            </div>
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

        {/* Action feedback */}
        {actionData && (
          <div className={`mb-6 p-4 rounded-lg ${
            actionData.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {actionData.message}
          </div>
        )}

        {/* Urgent Tasks Alert */}
        {urgentTasks.length > 0 && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <Icon name="alert-triangle" className="w-8 h-8 text-red-600" />
              <div>
                <h3 className="text-lg font-bold text-red-900 mb-2">
                  ⚠️ {urgentTasks.length} Urgente Taak{urgentTasks.length > 1 ? 'en' : ''}
                </h3>
                <ul className="space-y-1">
                  {urgentTasks.map((task: any) => (
                    <li key={task.id} className="text-red-800">
                      • {task.title}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pre-Event Checklist */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Pre-Event Checklist</h2>
              <button
                onClick={() => setShowAddChecklistItem(!showAddChecklistItem)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold flex items-center gap-2"
              >
                <Icon name="plus" className="w-4 h-4" />
                Toevoegen
              </button>
            </div>

            {/* Add Checklist Item Form */}
            {showAddChecklistItem && (
              <Form method="post" className="bg-white rounded-lg shadow-md p-6">
                <input type="hidden" name="action" value="add_checklist_item" />
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titel
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categorie
                    </label>
                    <select
                      name="category"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="material">Materiaal Voorbereiding</option>
                      <option value="staff">Staff Briefing</option>
                      <option value="zones">Rally Zones Setup</option>
                      <option value="catering">Catering</option>
                      <option value="other">Overige</option>
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                    >
                      Opslaan
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddChecklistItem(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Annuleren
                    </button>
                  </div>
                </div>
              </Form>
            )}

            {/* Progress Bar */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Totale Voortgang</span>
                <span className="text-sm font-medium text-gray-700">{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Checklist Items by Category */}
            {Object.keys(checklistByCategory).length > 0 ? (
              Object.entries(checklistByCategory).map(([category, items]: [string, any]) => (
                <div key={category} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 capitalize">
                    {category === 'material' && '🛠️ Materiaal Voorbereiding'}
                    {category === 'staff' && '👥 Staff Briefing'}
                    {category === 'zones' && '🗺️ Rally Zones Setup'}
                    {category === 'catering' && '🍽️ Catering'}
                    {category === 'other' && '📋 Overige'}
                  </h3>
                  <div className="space-y-2">
                    {items.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                        <Form method="post" className="flex-1 flex items-center gap-3">
                          <input type="hidden" name="action" value="toggle_checklist" />
                          <input type="hidden" name="itemId" value={item.id} />
                          <input type="hidden" name="completed" value={item.completed.toString()} />
                          <button
                            type="submit"
                            className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center ${
                              item.completed
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-300 hover:border-green-500'
                            }`}
                          >
                            {item.completed && <Icon name="check" className="w-4 h-4 text-white" />}
                          </button>
                          <span className={`flex-1 ${item.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {item.title}
                          </span>
                        </Form>
                        <Form method="post">
                          <input type="hidden" name="action" value="delete_checklist_item" />
                          <input type="hidden" name="itemId" value={item.id} />
                          <button
                            type="submit"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Icon name="trash-2" className="w-4 h-4" />
                          </button>
                        </Form>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <Icon name="check-square" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Geen checklist items. Voeg er een toe om te beginnen!</p>
              </div>
            )}
          </div>

          {/* Event Tasks */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Event Taken</h2>
              <button
                onClick={() => setShowAddTask(!showAddTask)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold flex items-center gap-2"
              >
                <Icon name="plus" className="w-4 h-4" />
                Nieuwe Taak
              </button>
            </div>

            {/* Add Task Form */}
            {showAddTask && (
              <Form method="post" className="bg-white rounded-lg shadow-md p-6">
                <input type="hidden" name="action" value="add_task" />
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titel
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Beschrijving
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prioriteit
                    </label>
                    <select
                      name="priority"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="low">Laag</option>
                      <option value="medium">Medium</option>
                      <option value="high">Hoog</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Toegewezen aan
                    </label>
                    <input
                      type="text"
                      name="assignedTo"
                      placeholder="Naam medewerker"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                    >
                      Taak Aanmaken
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddTask(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Annuleren
                    </button>
                  </div>
                </div>
              </Form>
            )}

            {/* Task Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-yellow-600">{pendingTasks.length}</div>
                <div className="text-sm text-yellow-700 font-medium">In Wachtrij</div>
              </div>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{inProgressTasks.length}</div>
                <div className="text-sm text-blue-700 font-medium">In Behandeling</div>
              </div>
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{completedTasks.length}</div>
                <div className="text-sm text-green-700 font-medium">Voltooid</div>
              </div>
            </div>

            {/* Task Lists */}
            <div className="space-y-4">
              {/* Pending Tasks */}
              {pendingTasks.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">🕐 In Wachtrij</h3>
                  <div className="space-y-3">
                    {pendingTasks.map((task: any) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                </div>
              )}

              {/* In Progress Tasks */}
              {inProgressTasks.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">⚙️ In Behandeling</h3>
                  <div className="space-y-3">
                    {inProgressTasks.map((task: any) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">✅ Voltooid</h3>
                  <div className="space-y-3">
                    {completedTasks.slice(0, 5).map((task: any) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                </div>
              )}

              {eventTasks.length === 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                  <Icon name="clipboard" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Geen taken. Voeg een taak toe om te beginnen!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: any }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{task.title}</h4>
          {task.description && (
            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs">
            <span className={`px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}>
              {task.priority.toUpperCase()}
            </span>
            {task.assigned_to && (
              <span className="text-gray-500">
                <Icon name="user" className="w-3 h-3 inline mr-1" />
                {task.assigned_to}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Form method="post">
            <input type="hidden" name="action" value="update_task" />
            <input type="hidden" name="taskId" value={task.id} />
            <select
              name="status"
              defaultValue={task.status}
              onChange={(e) => e.target.form?.requestSubmit()}
              className="text-xs px-2 py-1 border border-gray-300 rounded"
            >
              <option value="pending">In Wachtrij</option>
              <option value="in_progress">In Behandeling</option>
              <option value="completed">Voltooid</option>
            </select>
          </Form>
          <Form method="post">
            <input type="hidden" name="action" value="delete_task" />
            <input type="hidden" name="taskId" value={task.id} />
            <button
              type="submit"
              className="text-red-600 hover:text-red-700"
            >
              <Icon name="trash-2" className="w-4 h-4" />
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
