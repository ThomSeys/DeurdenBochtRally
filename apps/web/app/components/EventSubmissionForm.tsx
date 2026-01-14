import { useState } from 'react';

interface EventSubmissionFormProps {
  onSubmitSuccess?: () => void;
  userLocation?: { lat: number; lng: number } | null;
}

type FormStep = 'button' | 'type' | 'details';

function getEventTypeIcon(type: string, color: string): { svg: string; label: string } {
  const iconMap: Record<string, { svg: string; label: string }> = {
    closure: {
      label: 'Wegafzetting',
      svg: `<svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="6" width="16" height="12" fill="none" stroke="${color}" stroke-width="2" rx="2"/>
        <line x1="4" y1="10" x2="20" y2="10" stroke="${color}" stroke-width="2"/>
        <line x1="10" y1="6" x2="10" y2="18" stroke="${color}" stroke-width="2"/>
        <line x1="14" y1="6" x2="14" y2="18" stroke="${color}" stroke-width="2"/>
      </svg>`,
    },
    accident: {
      label: 'Ongeluk',
      svg: `<svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2 L22 7 L22 12 Q22 18 12 22 Q2 18 2 12 L2 7 Z" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
        <line x1="12" y1="10" x2="12" y2="16" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        <circle cx="12" cy="19" r="1.5" fill="${color}"/>
      </svg>`,
    },
    stop: {
      label: 'Stop',
      svg: `<svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="none" stroke="${color}" stroke-width="2"/>
        <line x1="4" y1="12" x2="20" y2="12" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
    },
    flood: {
      label: 'Overstroomd',
      svg: `<svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 16 Q6 12 9 16 Q12 12 15 16 Q18 12 21 16" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        <path d="M3 11 Q6 7 9 11 Q12 7 15 11 Q18 7 21 11" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        <rect x="2" y="18" width="20" height="3" fill="${color}" opacity="0.5"/>
      </svg>`,
    },
    warning: {
      label: 'Waarschuwing',
      svg: `<svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2 L22 20 L2 20 Z" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
        <line x1="12" y1="9" x2="12" y2="14" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        <circle cx="12" cy="18" r="1" fill="${color}"/>
      </svg>`,
    },
    info: {
      label: 'Info',
      svg: `<svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="none" stroke="${color}" stroke-width="2"/>
        <line x1="12" y1="8" x2="12" y2="8.5" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="12" y1="11" x2="12" y2="16" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
    },
    station: {
      label: 'Station',
      svg: `<svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 8 L4 18 C4 19.1 4.9 20 6 20 L18 20 C19.1 20 20 19.1 20 18 L20 8" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
        <line x1="8" y1="4" x2="8" y2="8" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        <line x1="12" y1="4" x2="12" y2="8" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        <line x1="16" y1="4" x2="16" y2="8" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        <line x1="4" y1="14" x2="20" y2="14" stroke="${color}" stroke-width="1" stroke-dasharray="2,2" opacity="0.5"/>
      </svg>`,
    },
  };
  return iconMap[type] || { label: 'Marker', svg: `` };
}

function getSubmitButtonIcon(color: string): string {
  return `<svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2 L22 7 L22 12 Q22 18 12 22 Q2 18 2 12 L2 7 Z" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"/>
    <line x1="12" y1="8" x2="12" y2="16" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="8" y1="12" x2="16" y2="12" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`;
}

const eventTypes = [
  { value: 'closure', label: 'Wegafzetting', color: 'bg-red-100 hover:bg-red-200' },
  { value: 'accident', label: 'Ongeluk', color: 'bg-red-100 hover:bg-red-200' },
  { value: 'stop', label: 'Stop', color: 'bg-orange-100 hover:bg-orange-200' },
  { value: 'flood', label: 'Overstroomd', color: 'bg-blue-100 hover:bg-blue-200' },
  { value: 'warning', label: 'Waarschuwing', color: 'bg-yellow-100 hover:bg-yellow-200' },
  { value: 'info', label: 'Info', color: 'bg-gray-100 hover:bg-gray-200' },
  { value: 'station', label: 'Station', color: 'bg-blue-100 hover:bg-blue-200' },
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
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-r from-primary-600 to-primary-700 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        title="Rapporteer een evenement"
        dangerouslySetInnerHTML={{ __html: getSubmitButtonIcon('white') }}
      />
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
          <div className="flex items-center gap-3">
            <div dangerouslySetInnerHTML={{ __html: getSubmitButtonIcon('#DC2626') }} />
            <h2 className="text-2xl font-bold text-gray-900">Rapporteer Evenement</h2>
          </div>
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {eventTypes.map((type) => {
                  const icon = getEventTypeIcon(type.value, '#374151');
                  return (
                    <button
                      key={type.value}
                      onClick={() => {
                        setFormData({ ...formData, type: type.value });
                        setStep('details');
                      }}
                      className={`p-4 rounded-sm text-center transition-all ${type.color}`}
                    >
                      <div className="mb-2 flex justify-center" dangerouslySetInnerHTML={{ __html: icon.svg }} />
                      <div className="text-xs font-medium text-gray-700 truncate">{type.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Severity - Colored Soft Tiles */}
            <div>              <p className="text-sm font-medium text-gray-700 mb-3">Ernst</p>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, severity: 'low' })}
                  className={`p-3 rounded-sm transition-all font-medium text-sm ${
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
                  className={`p-3 rounded-sm transition-all font-medium text-sm ${
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
                  className={`p-3 rounded-sm transition-all font-medium text-sm ${
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
                  className={`p-3 rounded-sm transition-all font-medium text-sm ${
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
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Location Status */}
            {userLocation && (
              <div className="p-3 rounded-sm bg-green-50 border border-green-200">
                <p className="text-sm text-green-700">
                  ✓ Locatie: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 rounded-sm bg-red-50 border border-red-200">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep('type')}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-sm hover:bg-gray-50 transition-colors font-medium"
              >
                Terug
              </button>
              <button
                type="submit"
                disabled={loading || !userLocation}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-sm hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
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
