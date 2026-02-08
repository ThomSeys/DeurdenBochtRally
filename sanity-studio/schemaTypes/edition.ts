import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'edition',
  title: 'Event Edition',
  type: 'document',
  fields: [
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      validation: (Rule) => Rule.required().min(2020).max(2100),
    }),
    defineField({
      name: 'name',
      title: 'Edition Name',
      type: 'string',
      description: 'E.g., "Deur den Bocht Rally 2026"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: {
        source: 'year',
        maxLength: 10,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isActive',
      title: 'Active Edition',
      type: 'boolean',
      description: 'Only one edition should be active at a time',
      initialValue: false,
    }),
    defineField({
      name: 'eventDate',
      title: 'Event Date',
      type: 'date',
    }),
    defineField({
      name: 'registrationOpen',
      title: 'Registration Open',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      year: 'year',
      name: 'name',
      isActive: 'isActive',
    },
    prepare(selection) {
      const { year, name, isActive } = selection;
      return {
        title: `${year} - ${name}`,
        subtitle: isActive ? '✅ Active' : 'Archived',
      };
    },
  },
});
