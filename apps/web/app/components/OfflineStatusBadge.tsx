import { useOfflineStatus } from '~/lib/offline.hooks';

export function OfflineStatusBadge() {
  const { isOnline, queuedCount, isLoading } = useOfflineStatus();

  if (isOnline && queuedCount === 0) {
    return null; // Don't show anything when fully online with no pending items
  }

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg bg-amber-50 border border-amber-200">
      <div
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      <span className="text-sm font-medium text-amber-900">
        {isOnline ? 'Online' : 'Offline'}
      </span>
      
      {queuedCount > 0 && !isLoading && (
        <span className="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
          {queuedCount} wachtend
        </span>
      )}
    </div>
  );
}
