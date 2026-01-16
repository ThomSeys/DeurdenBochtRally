import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'rallyZone',
  title: 'Rally Zone',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Zone Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'Location description (e.g., "Vlaamse Ardennen – ±12 km")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'exit',
      title: 'Exit Instructions',
      type: 'text',
      rows: 2,
      description: 'How to exit the main route',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'lus',
      title: 'Lus (Loop) Instructions',
      type: 'text',
      rows: 3,
      description: 'Detailed instructions for the loop',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'zoneType',
      title: 'Zone Type',
      type: 'string',
      description: 'Type determines length, difficulty, and checkpoint count',
      options: {
        list: [
          { title: 'Type A – Korte Verleider (5-8 km, 1 checkpoint)', value: 'short' },
          { title: 'Type B – Beslisser (15-25 km, 2 checkpoints)', value: 'medium' },
          { title: 'Type C – De Grote Omweg (30-45 km, 3 checkpoints)', value: 'long' },
        ],
      },
      initialValue: 'medium',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'estimatedDistance',
      title: 'Estimated Distance (km)',
      type: 'number',
      description: 'Estimated loop distance in kilometers',
      validation: (Rule) => Rule.required().min(5).max(50),
    }),
    defineField({
      name: 'checkpoints',
      title: 'Checkpoints',
      type: 'array',
      description: 'Multiple checkpoints for this zone (1-3 depending on type)',
      of: [
        {
          type: 'object',
          name: 'checkpoint',
          fields: [
            {
              name: 'name',
              title: 'Checkpoint Name',
              type: 'string',
              description: 'E.g., "Checkpoint 1: De Brug"',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 2,
              description: 'What the checkpoint is',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'codeHint',
              title: 'Code Hint',
              type: 'string',
              description: 'Hint for what to look for',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'solution',
              title: 'Solution Code',
              type: 'string',
              description: 'The correct answer/code for this checkpoint',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'validAnswers',
              title: 'Valid Answers',
              type: 'array',
              of: [{ type: 'string' }],
              description: 'Alternative accepted answers (including the main solution)',
              validation: (Rule) => Rule.required().min(1),
            },
            {
              name: 'location',
              title: 'Checkpoint Location',
              type: 'object',
              description: 'GPS coordinates for this checkpoint',
              fields: [
                {
                  name: 'lat',
                  title: 'Latitude',
                  type: 'number',
                  validation: (Rule) => Rule.min(-90).max(90),
                },
                {
                  name: 'lng',
                  title: 'Longitude',
                  type: 'number',
                  validation: (Rule) => Rule.min(-180).max(180),
                },
              ],
            },
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'description',
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1).max(3),
    }),
    defineField({
      name: 'checkpoint',
      title: 'Checkpoint (Legacy - will be migrated)',
      type: 'string',
      description: 'Old single checkpoint field - use Checkpoints array instead',
      hidden: true,
    }),
    defineField({
      name: 'codeHint',
      title: 'Code Hint (Legacy - will be migrated)',
      type: 'string',
      description: 'Old code hint field - use Checkpoints array instead',
      hidden: true,
    }),
    defineField({
      name: 'rejoin',
      title: 'Rejoin Instructions',
      type: 'text',
      rows: 2,
      description: 'How to rejoin the main route',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'points',
      title: 'Base Points',
      type: 'number',
      description: 'Base points for this zone (scales with type and checkpoints)',
      initialValue: 15,
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'solution',
      title: 'Solution Code (Legacy - will be migrated)',
      type: 'string',
      description: 'Old single solution field - use Checkpoints array instead',
      hidden: true,
    }),
    defineField({
      name: 'validAnswers',
      title: 'Valid Answers (Legacy - will be migrated)',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Old valid answers field - use Checkpoints array instead',
      hidden: true,
    }),
    defineField({
      name: 'color',
      title: 'Zone Color',
      type: 'string',
      options: {
        list: [
          { title: 'Green', value: 'green' },
          { title: 'Yellow', value: 'yellow' },
          { title: 'Orange', value: 'orange' },
          { title: 'Red', value: 'red' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'radius_m',
      title: 'Geofence Radius (meters)',
      type: 'number',
      description: 'GPS accuracy radius for zone validation (default: 30m)',
      initialValue: 30,
      validation: (Rule) => Rule.required().min(10).max(200),
    }),
    defineField({
      name: 'is_open',
      title: 'Zone is Open',
      type: 'boolean',
      description: 'Whether the zone is currently accepting scans',
      initialValue: true,
    }),
    defineField({
      name: 'reference_photo',
      title: 'Reference Photo',
      type: 'image',
      description: 'Reference photo for manual validation (what riders should photograph)',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'gpxRoute',
      title: 'Zone GPX Route',
      type: 'file',
      description: 'GPX file for this rally zone loop (optional)',
      options: {
        accept: '.gpx',
      },
    }),
    defineField({
      name: 'image',
      title: 'Zone Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'startPoint',
      title: 'Start Point Coordinates',
      type: 'object',
      description: 'Where the loop begins (exit from main route)',
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
    }),
    defineField({
      name: 'endPoint',
      title: 'End Point Coordinates',
      type: 'object',
      description: 'Where the loop ends (rejoin main route)',
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
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 0,
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
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
      order: 'order',
    },
    prepare(selection) {
      const { title, media, order } = selection;
      return {
        title,
        subtitle: `Order: ${order}`,
        media,
      };
    },
  },
});
