import { defineType } from 'sanity';

export default defineType({
  name: 'featureFlags',
  title: 'Feature Flags',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Feature naam',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'key',
      title: 'Key (technisch)',
      type: 'slug',
      options: {
        source: 'name',
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'enabled',
      title: 'Ingeschakeld',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'description',
      title: 'Beschrijving',
      type: 'text',
      rows: 3,
    },
    {
      name: 'category',
      title: 'Categorie',
      type: 'string',
      options: {
        list: [
          { title: 'Registratie', value: 'registration' },
          { title: 'Rally', value: 'rally' },
          { title: 'Community', value: 'community' },
          { title: 'Admin', value: 'admin' },
          { title: 'Content', value: 'content' },
          { title: 'Algemeen', value: 'general' },
        ],
      },
    },
    {
      name: 'enabledFrom',
      title: 'Ingeschakeld vanaf',
      type: 'datetime',
      description: 'Optioneel: automatisch inschakelen vanaf deze datum',
    },
    {
      name: 'enabledUntil',
      title: 'Ingeschakeld tot',
      type: 'datetime',
      description: 'Optioneel: automatisch uitschakelen na deze datum',
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'description',
      enabled: 'enabled',
    },
    prepare({ title, subtitle, enabled }) {
      return {
        title: `${enabled ? '✅' : '❌'} ${title}`,
        subtitle: subtitle || 'Geen beschrijving',
      };
    },
  },
});
