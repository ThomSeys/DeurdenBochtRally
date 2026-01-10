import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'siteConfig',
  title: 'Site Configuration',
  type: 'document',
  fields: [
    defineField({
      name: 'eventName',
      title: 'Event Name',
      type: 'string',
      initialValue: 'Den Bochtenkoning Rally 2026',
    }),
    defineField({
      name: 'eventDate',
      title: 'Event Date',
      type: 'date',
      initialValue: '2026-05-16',
    }),
    defineField({
      name: 'eventLocation',
      title: 'Event Location',
      type: 'string',
      initialValue: 'Café Belami, Aalter',
    }),
    defineField({
      name: 'eventTagline',
      title: 'Event Tagline',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'contactEmail',
      title: 'Contact Email',
      type: 'string',
    }),
    defineField({
      name: 'contactWhatsapp',
      title: 'WhatsApp Number',
      type: 'string',
    }),
    defineField({
      name: 'contactLocation',
      title: 'Contact Location',
      type: 'string',
    }),
    defineField({
      name: 'socialFacebook',
      title: 'Facebook URL',
      type: 'url',
    }),
    defineField({
      name: 'socialInstagram',
      title: 'Instagram URL',
      type: 'url',
    }),
    defineField({
      name: 'socialStrava',
      title: 'Strava Club URL',
      type: 'url',
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      description: 'Title tag for search engines (max 60 characters)',
      validation: (Rule) => Rule.max(60),
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      description: 'Meta description for search engines (max 160 characters)',
      rows: 3,
      validation: (Rule) => Rule.max(160),
    }),
    defineField({
      name: 'seoImage',
      title: 'SEO Share Image',
      type: 'image',
      description: 'Image shown when sharing on social media (recommended: 1200x630px)',
    }),
    defineField({
      name: 'noIndex',
      title: 'No Index',
      type: 'boolean',
      description: 'Prevent search engines from indexing this site',
      initialValue: true,
    }),
    defineField({
      name: 'noFollow',
      title: 'No Follow',
      type: 'boolean',
      description: 'Prevent search engines from following links on this site',
      initialValue: true,
    }),
    defineField({
      name: 'edition',
      title: 'Edition',
      type: 'reference',
      to: [{ type: 'edition' }],
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Site Configuration',
      };
    },
  },
});
