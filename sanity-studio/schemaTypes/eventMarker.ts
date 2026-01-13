import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'eventMarker',
  title: 'Event Marker',
  type: 'document',
  description: 'Live event markers for the rally day (road closures, accidents, stops, etc.)',
  fields: [
    defineField({
      name: 'title',
      title: 'Event Title',
      type: 'string',
      description: 'Brief title (e.g., "Road Closure", "Accident", "Water Station")',
      validation: (Rule) => Rule.required().max(50),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'Detailed information about the event',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Event Type',
      type: 'string',
      options: {
        list: [
          { title: '🚧 Road Closure', value: 'closure' },
          { title: '🚨 Accident', value: 'accident' },
          { title: '⛔ Stop', value: 'stop' },
          { title: '🌊 Flooded Road', value: 'flood' },
          { title: '⚠️ Warning', value: 'warning' },
          { title: 'ℹ️ Information', value: 'info' },
          { title: '💧 Water/Fuel Station', value: 'station' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'object',
      fields: [
        {
          name: 'lat',
          title: 'Latitude',
          type: 'number',
          validation: (Rule) => Rule.required().min(-90).max(90),
        },
        {
          name: 'lng',
          title: 'Longitude',
          type: 'number',
          validation: (Rule) => Rule.required().min(-180).max(180),
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'severity',
      title: 'Severity',
      type: 'string',
      options: {
        list: [
          { title: 'Low', value: 'low' },
          { title: 'Medium', value: 'medium' },
          { title: 'High', value: 'high' },
          { title: 'Critical', value: 'critical' },
        ],
      },
      initialValue: 'medium',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isActive',
      title: 'Is Active',
      type: 'boolean',
      description: 'Toggle to show/hide this marker on the map',
      initialValue: true,
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'updatedAt',
      title: 'Updated At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'edition',
      title: 'Edition',
      type: 'reference',
      to: [{ type: 'edition' }],
      validation: (Rule) => Rule.required(),
    }),
  ],
  orderings: [
    {
      title: 'Most Recent',
      name: 'mostRecent',
      by: [{ field: 'createdAt', direction: 'desc' }],
    },
    {
      title: 'Severity',
      name: 'severity',
      by: [{ field: 'severity', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      type: 'type',
      isActive: 'isActive',
      severity: 'severity',
    },
    prepare(selection) {
      const { title, type, isActive, severity } = selection;
      const typeEmoji: Record<string, string> = {
        closure: '🚧',
        accident: '🚨',
        stop: '⛔',
        flood: '🌊',
        warning: '⚠️',
        info: 'ℹ️',
        station: '💧',
      };
      return {
        title: `${typeEmoji[type] || '📍'} ${title}`,
        subtitle: `${severity.toUpperCase()} • ${isActive ? 'Active' : 'Inactive'}`,
      };
    },
  },
});
