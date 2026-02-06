import { useState } from 'react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { Form, useLoaderData, useActionData, useNavigation } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);

  const { data: achievements, error } = await supabaseAdmin
    .from('achievements')
    .select('*')
    .order('category', { ascending: true })
    .order('points', { ascending: true });

  if (error) {
    throw new Error('Failed to load achievements');
  }

  return { achievements: achievements || [] };
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);

  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'update-criteria') {
    const achievementId = formData.get('achievementId');
    const title = formData.get('title');
    const description = formData.get('description');
    const icon = formData.get('icon');
    const category = formData.get('category');
    const points = formData.get('points');
    const criteriaType = formData.get('criteriaType');
    const criteriaValue = formData.get('criteriaValue');
    const timeBefore = formData.get('timeBefore');
    const timeAfter = formData.get('timeAfter');

    if (!achievementId) {
      return { error: 'Achievement ID is verplicht' };
    }

    const updates: any = {};

    // Update basic fields if provided (check for null/undefined, not falsiness)
    if (title !== null && title !== undefined) updates.title = title;
    if (description !== null && description !== undefined) updates.description = description;
    if (icon !== null && icon !== undefined) updates.icon = icon;
    if (category !== null && category !== undefined) updates.category = category;

    // Update criteria if type is provided
    if (criteriaType) {
      let criteria: any = { type: criteriaType };

      if (criteriaType === 'checkin_time') {
        if (timeBefore) criteria.time_before = timeBefore;
        if (timeAfter) criteria.time_after = timeAfter;
      } else if (criteriaValue) {
        criteria.value = parseInt(criteriaValue as string);
      }

      updates.criteria = criteria;
    }

    const { error } = await supabaseAdmin
      .from('achievements')
      .update(updates)
      .eq('id', Number(achievementId));

    if (error) {
      return { error: error.message };
    }

    return { success: 'Achievement bijgewerkt!' };
  }

  if (intent === 'create') {
    const name = formData.get('name');
    const title = formData.get('title');
    const description = formData.get('description');
    const icon = formData.get('icon');
    const category = formData.get('category');

    if (!name || !title || !description || !icon || !category) {
      return { error: 'Alle velden zijn verplicht' };
    }

    const { error } = await supabaseAdmin
      .from('achievements')
      .insert({
        name: name as string,
        title: title as string,
        description: description as string,
        icon: icon as string,
        category: category as string,
        points: 0,
      });

    if (error) {
      return { error: error.message };
    }

    return { success: 'Achievement aangemaakt!' };
  }

  return { error: 'Onbekende actie' };
}

export default function AdminAchievements() {
  const { achievements } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const [editingId, setEditingId] = useState<number | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  
  const editingAchievement = achievements.find(a => a.id === editingId);

  const criteriaTypes = [
    { value: 'zones', label: 'Aantal zones' },
    { value: 'photos', label: 'Aantal foto\'s' },
    { value: 'likes', label: 'Aantal likes' },
    { value: 'stories', label: 'Aantal verhalen' },
    { value: 'checkin_time', label: 'Check-in tijd' },
    { value: 'combo', label: 'Combinatie (geavanceerd)' },
  ];

  const categories = [
    { value: 'progress', label: 'Vooruitgang' },
    { value: 'completion', label: 'Voltooiing' },
    { value: 'social', label: 'Sociaal' },
    { value: 'special', label: 'Speciaal' },
  ];

  const getCriteriaDisplay = (achievement: any) => {
    if (!achievement.criteria) return 'Geen criteria ingesteld';

    const { type, value, time_before, time_after } = achievement.criteria;

    switch (type) {
      case 'zones':
        return `${value} zones voltooien`;
      case 'photos':
        return `${value} foto's uploaden`;
      case 'likes':
        return `${value} likes verzamelen`;
      case 'stories':
        return `${value} verhalen delen`;
      case 'checkin_time':
        if (time_before) return `Inchecken voor ${time_before}`;
        if (time_after) return `Inchecken na ${time_after}`;
        return 'Tijd gebaseerd';
      case 'combo':
        return 'Gecombineerde voorwaarden';
      default:
        return 'Onbekend type';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="relative bg-gradient-to-br from-yellow-600 via-amber-600 to-amber-700 text-white py-16 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
            <Icon name="award" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Achievements Beheer</h1>
          <p className="text-xl text-amber-100">Configureer achievements en criteria</p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Achievements Beheer</h2>
          </div>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <Icon name="plus" className="w-5 h-5 mr-2" />
            Nieuwe Achievement
          </button>
        </div>

        {/* Success/Error Messages */}
        {actionData?.success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {actionData.success}
          </div>
        )}
        {actionData?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {actionData.error}
          </div>
        )}

        {/* New Achievement Form */}
        {showNewForm && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Nieuwe Achievement</h2>
            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="create" />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Technische naam (uniek)
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Titel
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Beschrijving
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Icon (emoji)
                  </label>
                  <input
                    type="text"
                    name="icon"
                    required
                    placeholder="🏆"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Categorie
                  </label>
                  <select
                    name="category"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  Aanmaken
                </button>
              </div>
            </Form>
          </div>
        )}

        {/* Achievements List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Mobile Card View */}
          <div className="block md:hidden divide-y divide-gray-200">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{achievement.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800">
                    {achievement.category}
                  </span>
                  <button
                    onClick={() => setEditingId(editingId === achievement.id ? null : achievement.id)}
                    className="text-sm text-primary-600 hover:text-primary-900 font-medium"
                  >
                    Bewerken
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Criteria:</strong> {getCriteriaDisplay(achievement)}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <table className="hidden md:table min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Achievement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criteria
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {achievements.map((achievement) => (
                <tr key={achievement.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{achievement.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {achievement.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {achievement.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
                      {achievement.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getCriteriaDisplay(achievement)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setEditingId(editingId === achievement.id ? null : achievement.id)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      {editingId === achievement.id ? 'Sluiten' : 'Bewerken'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Edit Modal */}
        {editingAchievement && (
          <div className="fixed inset-0 z-[1100] overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setEditingId(null)}
              />

              {/* Modal */}
              <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Achievement Bewerken
                      </h3>
                      <p className="text-sm text-gray-500">
                        Pas alle velden aan (technische naam kan niet worden gewijzigd)
                      </p>
                    </div>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <Icon name="x" className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Edit Form */}
                  <Form method="post" className="space-y-4">
                    <input type="hidden" name="intent" value="update-criteria" />
                    <input type="hidden" name="achievementId" value={editingAchievement.id} />

                    {/* Basic Info Section */}
                    <div className="border-b pb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Algemene Info</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Titel
                          </label>
                          <input
                            type="text"
                            name="title"
                            defaultValue={editingAchievement.title}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Beschrijving
                          </label>
                          <textarea
                            name="description"
                            defaultValue={editingAchievement.description}
                            rows={2}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Icon (emoji)
                          </label>
                          <input
                            type="text"
                            name="icon"
                            defaultValue={editingAchievement.icon}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Categorie
                          </label>
                          <select
                            name="category"
                            defaultValue={editingAchievement.category}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          >
                            {categories.map(cat => (
                              <option key={cat.value} value={cat.value}>
                                {cat.label}
                              </option>
                            ))}
                          </select>
                        </div>

                      </div>
                    </div>

                    {/* Criteria Section */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Criteria</h4>
                      <div className="mb-3 p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="text-sm font-medium text-blue-900">Huidige criteria:</p>
                        <p className="text-sm text-blue-700">
                          {editingAchievement.criteria ? (
                            <>
                              Type: <strong>{editingAchievement.criteria.type}</strong>
                              {editingAchievement.criteria.value && <> | Waarde: <strong>{editingAchievement.criteria.value}</strong></>}
                              {editingAchievement.criteria.time_before && <> | Voor: <strong>{editingAchievement.criteria.time_before}</strong></>}
                              {editingAchievement.criteria.time_after && <> | Na: <strong>{editingAchievement.criteria.time_after}</strong></>}
                            </>
                          ) : (
                            <span className="text-red-600">Nog geen criteria ingesteld</span>
                          )}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Criteria Type
                          </label>
                          <select
                            name="criteriaType"
                            defaultValue={editingAchievement.criteria?.type || ''}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          >
                            <option value="">Selecteer type...</option>
                            {criteriaTypes.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Waarde (voor zones/photos/likes/stories)
                          </label>
                          <input
                            type="number"
                            name="criteriaValue"
                            defaultValue={editingAchievement.criteria?.value || ''}
                            placeholder="Bijv. 5"
                            min="0"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Tijd voor (HH:MM, voor early bird)
                          </label>
                          <input
                            type="text"
                            name="timeBefore"
                            placeholder="08:00"
                            defaultValue={editingAchievement.criteria?.time_before || ''}
                            pattern="[0-2][0-9]:[0-5][0-9]"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Tijd na (HH:MM, voor night rider)
                          </label>
                          <input
                            type="text"
                            name="timeAfter"
                            placeholder="20:00"
                            defaultValue={editingAchievement.criteria?.time_after || ''}
                            pattern="[0-2][0-9]:[0-5][0-9]"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          />
                        </div>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="text-xs text-yellow-800">
                          <strong>💡 Tip:</strong> Voor 'zones', 'photos', 'likes', en 'stories' vul je alleen <strong>Waarde</strong> in. 
                          Voor 'checkin_time' vul je <strong>Tijd voor</strong> OF <strong>Tijd na</strong> in (niet beide).
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Annuleren
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                      >
                        💾 Achievement Opslaan
                      </button>
                    </div>
                  </Form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">ℹ️ Criteria Types</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li><strong>Zones:</strong> Aantal zone check-ins vereist</li>
            <li><strong>Photos:</strong> Aantal geüploade foto's vereist</li>
            <li><strong>Likes:</strong> Totaal aantal likes op alle foto's</li>
            <li><strong>Stories:</strong> Aantal gepubliceerde verhalen</li>
            <li><strong>Check-in tijd:</strong> Check-in voor of na een bepaalde tijd (HH:MM format)</li>
            <li><strong>Combo:</strong> Meerdere voorwaarden (vereist handmatige SQL update)</li>
          </ul>
      </div>
      </div>
    </div>
  );
}
