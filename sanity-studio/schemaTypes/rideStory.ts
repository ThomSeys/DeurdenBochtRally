import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'rideStory',
  title: 'Ride Story',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Story Title',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Short Excerpt',
      type: 'text',
      rows: 3,
      description: 'Brief description for story cards (max 200 characters)',
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: 'content',
      title: 'Story Content',
      type: 'array',
      of: [
        { 
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
            {title: 'Quote', value: 'blockquote'}
          ],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Numbered', value: 'number'}
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
            ],
          },
        },
        {
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative Text',
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
            }
          ]
        }
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'participantId',
      title: 'Participant ID',
      type: 'string',
      description: 'Supabase participant UUID',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'participantName',
      title: 'Participant Name',
      type: 'string',
      description: 'Display name of the author',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'edition',
      title: 'Edition',
      type: 'reference',
      to: [{ type: 'edition' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'isApproved',
      title: 'Approved',
      type: 'boolean',
      initialValue: false,
      description: 'Must be approved by admin before showing publicly',
    }),
    defineField({
      name: 'isFeatured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
      description: 'Featured stories appear at the top of the feed',
    }),
    defineField({
      name: 'likeCount',
      title: 'Like Count',
      type: 'number',
      initialValue: 0,
      readOnly: true,
    }),
    defineField({
      name: 'viewCount',
      title: 'View Count',
      type: 'number',
      initialValue: 0,
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      author: 'participantName',
      media: 'heroImage',
      approved: 'isApproved',
      featured: 'isFeatured',
    },
    prepare(selection) {
      const { title, author, media, approved, featured } = selection;
      let subtitle = author;
      if (featured) subtitle = `⭐ ${subtitle}`;
      if (!approved) subtitle = `🔒 ${subtitle}`;
      return {
        title,
        subtitle,
        media,
      };
    },
  },
  orderings: [
    {
      title: 'Published Date (Newest First)',
      name: 'publishedDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
    {
      title: 'Featured First',
      name: 'featuredFirst',
      by: [
        { field: 'isFeatured', direction: 'desc' },
        { field: 'publishedAt', direction: 'desc' },
      ],
    },
  ],
});
