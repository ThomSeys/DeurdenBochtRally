import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'pricingTier',
  title: 'Pricing Tier',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Tier Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Price (€)',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'icon',
      title: 'Icon (emoji)',
      type: 'string',
      description: 'Emoji or icon to display, e.g., 🍽️ or ☕',
    }),
    defineField({
      name: 'features',
      title: 'Features',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Lijst van features, één per item',
    }),
    defineField({
      name: 'highlighted',
      title: 'Highlight this tier?',
      type: 'boolean',
      initialValue: false,
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
      title: 'name',
      price: 'price',
      highlighted: 'highlighted',
    },
    prepare(selection) {
      const { title, price, highlighted } = selection;
      return {
        title,
        subtitle: `€${price}${highlighted ? ' ⭐' : ''}`,
      };
    },
  },
});
