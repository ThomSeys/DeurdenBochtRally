import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'videoEmbed',
  title: 'Video Embed',
  type: 'object',
  fields: [
    defineField({
      name: 'provider',
      title: 'Provider',
      type: 'string',
      options: { list: [ { title: 'YouTube', value: 'youtube' }, { title: 'GoPro', value: 'gopro' }, { title: 'Other', value: 'other' } ] },
    }),
    defineField({ name: 'url', title: 'Video URL', type: 'url' }),
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'caption', title: 'Caption', type: 'text' }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'provider', media: 'url' }
  }
});
