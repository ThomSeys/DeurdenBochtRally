import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'videoRecap',
  title: 'Video Recap',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required().max(150) }),
    defineField({ name: 'participantId', title: 'Participant ID', type: 'string', description: 'Supabase participant UUID' }),
    defineField({ name: 'participantName', title: 'Participant Name', type: 'string' }),
    defineField({ name: 'edition', title: 'Edition', type: 'reference', to: [{ type: 'edition' }] }),
    defineField({ name: 'videoUrl', title: 'Video URL', type: 'url' }),
    defineField({ name: 'thumbnail', title: 'Thumbnail', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'duration_seconds', title: 'Duration (seconds)', type: 'number' }),
    defineField({ name: 'status', title: 'Status', type: 'string', description: 'upload/processing/ready' }),
    defineField({ name: 'metadata', title: 'Metadata', type: 'object', fields: [
      defineField({ name: 'fileSize', title: 'File Size (bytes)', type: 'number' }),
      defineField({ name: 'format', title: 'Format', type: 'string' }),
      defineField({ name: 'resolution', title: 'Resolution', type: 'string' }),
    ]}),
    defineField({ name: 'publishedAt', title: 'Published At', type: 'datetime', initialValue: () => new Date().toISOString() }),
    defineField({ name: 'isApproved', title: 'Approved', type: 'boolean', initialValue: false }),
  ],
  preview: {
    select: { title: 'title', media: 'thumbnail', subtitle: 'participantName' },
  },
});
