import { useState } from 'react';

interface EventSubmissionFormProps {
  onSubmitSuccess?: () => void;
  userLocation?: { lat: number; lng: number } | null;
}

type FormStep = 'button' | 'type' | 'details';

const eventTypes = [
  { value: 'closure', icon: '🚧', label: 'Wegafzetting', color: 'bg-red-100 hover:bg-red-200' },
  { value: 'accident', icon: '🚨', label: 'Ongeluk', color: 'bg-red-100 hover:bg-red-200' },
  { value: 'stop', icon: '⛔', label: 'Stop', color: 'bg-orange-100 hover:bg-orange-200' },
  { value: 'flood', icon: '🌊', label: 'Overstroomd', color: 'bg-blue-100 hover:bg-blue-200' },
  { value: 'warning', icon: '⚠️', label: 'Waarschuwing', color: 'bg-yellow-100 hover:bg-yellow-200' },
  { value: 'info', icon: 'ℹ️', label: 'Info', color: 'bg-gray-100 hover:bg-gray-200' },
  { value: 'station', icon: '💧', label: 'Station', color: 'bg-blue-100 hover:bg-blue-200' },
];

export default function EventSubmissionForm({ onSubmitSuccess, userLocation: propLocation }: EventSubmissionFormProps) {
  const [step, setStep] = useState<FormStep>('button');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    type: 'warning',
    title: '',
    description: '',
    severity: 'medium',
  });

  // Get location from prop (provided by parent map component)
  const userLocation = propLocation;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userLocation) {
      console.warn('Submit attempt without location');
      setError('📍 Locatie niet beschikbaar. Controleer of locatiediensten ingeschakeld zijn.');
      return;
    }

    console.log('Submitting with location:', userLocation);
    setLoading(true);
    setError(null);

    try {
      const payload = {
        title: formData.title || eventTypes.find(t => t.value === formData.type)?.label,
        description: formData.description || '',
        type: formData.type,
        severity: formData.severity,
        location: {
          lat: userLocation.lat,
          lng: userLocation.lng,
        },
      };
      console.log('Payload:', payload);

      const response = await fetch('/api/events/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Response:', data);

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Verzenden mislukt');
      }

      setSuccess(true);
      setTimeout(() => {
        setStep('button');
        setSuccess(false);
        setFormData({ type: 'warning', title: '', description: '', severity: 'medium' });
        onSubmitSuccess?.();
      }, 2000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Fout bij verzenden';
      console.error('Submit error:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'button') {
    return (
      <button
        onClick={() => setStep('type')}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        title="Rapporteer een evenement"
      >
        <span className="text-2xl">🚨</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 cursor-pointer"
        onClick={() => setStep('button')}
      />

      {/* Sheet */}
      <div
        className="relative w-full bg-white rounded-t-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">🚨 Rapporteer Evenement</h2>
          <button
            onClick={() => setStep('button')}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✓</div>
            <h3 className="text-xl font-bold text-green-600">Bedankt!</h3>
            <p className="text-gray-600 mt-2">Uw evenement verschijnt binnenkort op de kaart.</p>
          </div>
        ) : step === 'type' ? (
          <div className="space-y-6">
            {/* Event Type Selection with Icons */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-4">Selecteer evenement type</p>
              <div className="grid grid-cols-4 gap-3">
                {eventTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setFormData({ ...formData, type: type.value });
                      setStep('details');
                    }}
                    className={`p-4 rounded-lg text-center transition-all ${type.color}`}
                  >
                    <div className="text-3xl mb-2">{type.icon}</div>
                    <div className="text-xs font-medium text-gray-700">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Severity - Colored Soft Tiles */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Ernst</p>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, severity: 'low' })}
                  className={`p-3 rounded-lg transition-all font-medium text-sm ${
                    formData.severity === 'low'
                      ? 'bg-green-300/40 border-2 border-green-500 ring-2 ring-green-400'
                      : 'bg-green-100/50 border-2 border-transparent hover:bg-green-100/70'
                  }`}
                >
                  Laag
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, severity: 'medium' })}
                  className={`p-3 rounded-lg transition-all font-medium text-sm ${
                    formData.severity === 'medium'
                      ? 'bg-yellow-300/40 border-2 border-yellow-500 ring-2 ring-yellow-400'
                      : 'bg-yellow-100/50 border-2 border-transparent hover:bg-yellow-100/70'
                  }`}
                >
                  Gemiddeld
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, severity: 'high' })}
                  className={`p-3 rounded-lg transition-all font-medium text-sm ${
                    formData.severity === 'high'
                      ? 'bg-orange-300/40 border-2 border-orange-500 ring-2 ring-orange-400'
                      : 'bg-orange-100/50 border-2 border-transparent hover:bg-orange-100/70'
                  }`}
                >
                  Hoog
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, severity: 'critical' })}
                  className={`p-3 rounded-lg transition-all font-medium text-sm ${
                    formData.severity === 'critical'
                      ? 'bg-red-300/40 border-2 border-red-500 ring-2 ring-red-400'
                      : 'bg-red-100/50 border-2 border-transparent hover:bg-red-100/70'
                  }`}
                >
                  Kritiek
                </button>
              </div>
            </div>

            {/* Title (Optional) */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Titel <span className="text-gray-500">(optioneel)</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Beschrijf het evenement kort"
                maxLength={50}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.title.length}/50</p>
            </div>

            {/* Description (Optional) */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Details <span className="text-gray-500">(optioneel)</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Meer informatie..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Location Status */}
            {userLocation && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-green-700">
                  ✓ Locatie: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep('type')}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Terug
              </button>
              <button
                type="submit"
                disabled={loading || !userLocation}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
              >
                {loading ? 'Verzenden...' : 'Verzenden'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
