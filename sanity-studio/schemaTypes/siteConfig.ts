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
      name: 'startLocation',
      title: 'Start Location Coordinates',
      type: 'object',
      fields: [
        defineField({ name: 'lat', type: 'number', title: 'Latitude' }),
        defineField({ name: 'lng', type: 'number', title: 'Longitude' }),
        defineField({ name: 'label', type: 'string', title: 'Label' }),
      ],
      initialValue: {
        lat: 51.0967,
        lng: 3.4400,
        label: 'Café Den Belami, Aalter',
      },
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
      name: 'heroBackgroundImage',
      title: 'Hero Background Image',
      type: 'image',
      description: 'Large background image for the hero section (recommended: 1920x1080px)',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'featureImage1',
      title: 'Feature Image 1',
      type: 'image',
      description: 'Image for "What is it?" section (recommended: 800x600px)',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'featureImage2',
      title: 'Feature Image 2',
      type: 'image',
      description: 'Image for rally zones card (recommended: 600x400px)',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'featureImage3',
      title: 'Feature Image 3',
      type: 'image',
      description: 'Image for points card (recommended: 600x400px)',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'maxRegistrations',
      title: 'Maximum Registrations',
      type: 'number',
      description: 'Maximum number of participants allowed to register (admins are not counted)',
      validation: (Rule) => Rule.min(1),
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
      name: 'gpxRouteFile',
      title: 'GPX Route File (Legacy)',
      type: 'file',
      description: 'Legacy single GPX file - use gpxRouteFiles instead',
      hidden: true,
      options: {
        accept: '.gpx',
      },
    }),
    defineField({
      name: 'gpxRouteFiles',
      title: 'GPX Route Files',
      type: 'array',
      description: 'Upload multiple GPX route files to display on the live map (e.g., main route, alternate routes, etc.)',
      of: [
        {
          type: 'file',
          options: {
            accept: '.gpx',
          },
        },
      ],
    }),
    defineField({
      name: 'spotifyPlaylistUrl',
      title: 'Spotify Playlist Embed URL',
      type: 'url',
      description: 'Spotify embed URL (e.g., https://open.spotify.com/embed/playlist/...) for the event soundtrack',
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
