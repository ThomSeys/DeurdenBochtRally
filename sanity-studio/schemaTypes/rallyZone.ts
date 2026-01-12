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
      name: 'checkpoint',
      title: 'Checkpoint',
      type: 'string',
      description: 'What the checkpoint is',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'codeHint',
      title: 'Code Hint',
      type: 'string',
      description: 'Hint for what to look for at the checkpoint',
      validation: (Rule) => Rule.required(),
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
      title: 'Points',
      type: 'number',
      initialValue: 15,
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'solution',
      title: 'Solution Code',
      type: 'string',
      description: 'The primary correct answer/code for this zone',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'validAnswers',
      title: 'Valid Answers',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Alternative accepted answers (including the main solution). Add variations like "Belvédère", "Belvedere", etc.',
      validation: (Rule) => Rule.required().min(1),
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
