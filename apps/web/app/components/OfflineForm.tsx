import { useEffect, useState } from 'react';
import { useOfflineStatus } from '~/lib/offline.hooks';
import { queueOfflineSubmission, isOnline } from '~/lib/offline.utils';

interface OfflineFormProps {
  onSubmit: (data: FormData) => Promise<Response>;
  endpoint: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  children: React.ReactNode;
  className?: string;
}

/**
 * Form component that queues submissions when offline
 * Automatically handles offline queueing and syncing
 */
export function OfflineForm({
  onSubmit,
  endpoint,
  method = 'POST',
  children,
  className = '',
}: OfflineFormProps) {
  const { isOnline: online, queuedCount } = useOfflineStatus();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData);

      if (!isOnline()) {
        // Queue for later sync
        console.log('Offline: Queueing submission', { endpoint, method });
        await queueOfflineSubmission(endpoint, data, method);
        setSuccess(
          'Opgeslagen offline. Het wordt verzonden wanneer je weer online bent.'
        );
        e.currentTarget.reset();
        return;
      }

      // Try to submit online
      try {
        const response = await onSubmit(formData);

        if (!response.ok) {
          // Fallback to queue if request fails
          console.log('Submit failed, queueing for later');
          await queueOfflineSubmission(endpoint, data, method);
          setSuccess(
            'Opgeslagen voor later. Het wordt verzonden wanneer mogelijk.'
          );
        } else {
          setSuccess('Verzonden!');
          e.currentTarget.reset();
        }
      } catch (submitError) {
        console.error('Submit error, queueing:', submitError);
        await queueOfflineSubmission(endpoint, data, method);
        setSuccess(
          'Opgeslagen voor offline. Het wordt verzonden wanneer je weer online bent.'
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Er ging iets mis';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}

      {!isOnline() && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-sm">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">📳 Je bent offline</span> - inzendingen
            worden opgeslagen en verzonden wanneer je weer online bent.
          </p>
        </div>
      )}

      {queuedCount > 0 && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-sm">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">⏳ {queuedCount} wachtend</span> om
            verzonden te worden.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-sm">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-sm">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}
    </form>
  );
}

/**
 * Hook for forms that need offline support
 * Returns utilities for handling offline submissions
 */
export function useOfflineForm(endpoint: string, method: 'POST' | 'PUT' | 'PATCH' = 'POST') {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { isOnline: online } = useOfflineStatus();

  const submit = async (data: Record<string, any>) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (!isOnline()) {
        await queueOfflineSubmission(endpoint, data, method);
        setSuccess('Opgeslagen offline - verzonden wanneer je weer online bent');
        return true;
      }

      try {
        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          await queueOfflineSubmission(endpoint, data, method);
          setSuccess('Opgeslagen voor later');
          return true;
        }

        setSuccess('Verzonden!');
        return true;
      } catch (submitError) {
        await queueOfflineSubmission(endpoint, data, method);
        setSuccess('Opgeslagen offline - verzonden wanneer je weer online bent');
        return true;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fout';
      setError(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting, error, success, isOnline: online };
}
