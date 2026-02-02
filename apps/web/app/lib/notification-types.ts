// Event type configurations
export const eventTypeConfig: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  rallyStart: { label: 'Rally Start', color: 'text-green-800', bgColor: 'bg-green-100', icon: 'flag' },
  rallyEnd: { label: 'Rally Einde', color: 'text-gray-800', bgColor: 'bg-gray-100', icon: 'flag' },
  weatherWarning: { label: 'Weerswaarschuwing', color: 'text-orange-800', bgColor: 'bg-orange-100', icon: 'cloud' },
  zoneOpened: { label: 'Zone Geopend', color: 'text-blue-800', bgColor: 'bg-blue-100', icon: 'map' },
  zoneClosed: { label: 'Zone Gesloten', color: 'text-red-800', bgColor: 'bg-red-100', icon: 'x-circle' },
  criticalEvent: { label: 'Kritiek Incident', color: 'text-red-800', bgColor: 'bg-red-100', icon: 'alert-triangle' },
  eventResolved: { label: 'Incident Opgelost', color: 'text-green-800', bgColor: 'bg-green-100', icon: 'check-circle' },
  eventCancelled: { label: 'Incident Verwijderd', color: 'text-gray-800', bgColor: 'bg-gray-100', icon: 'bell' },
  achievementUnlocked: { label: 'Prestatie', color: 'text-purple-800', bgColor: 'bg-purple-100', icon: 'award' },
  custom: { label: 'Aangepast', color: 'text-blue-800', bgColor: 'bg-blue-100', icon: 'bell' },
};

export function getEventTypeDisplay(eventType: string | undefined | null) {
  if (!eventType) return eventTypeConfig.custom;
  return eventTypeConfig[eventType] || eventTypeConfig.custom;
}
