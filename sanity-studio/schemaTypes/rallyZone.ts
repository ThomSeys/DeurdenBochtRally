import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'rallyZone',
  title: 'Rally Zone',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Zone Naam',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Zone Beschrijving',
      type: 'text',
      rows: 4,
      description: 'Algemene beschrijving van deze zone',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'location',
      title: 'Locatie',
      type: 'string',
      description: 'Locatie beschrijving (bijv., "Vlaamse Ardennen")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'routeTips',
      title: 'Routetips',
      type: 'array',
      description: 'Meerdere routetips binnen deze zone - deelnemers kunnen kiezen',
      of: [
        {
          type: 'object',
          name: 'routeTip',
          fields: [
            {
              name: 'name',
              title: 'Routetip Naam',
              type: 'string',
              description: 'Bijv., "De Panoramische Route" of "Off-road Adventure"',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'description',
              title: 'Beschrijving',
              type: 'text',
              rows: 3,
              description: 'Wat maakt deze route bijzonder?',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'routeType',
              title: 'Route Type',
              type: 'string',
              description: 'Welk type route is dit?',
              options: {
                list: [
                  { title: 'Off-road', value: 'offroad' },
                  { title: 'Technisch', value: 'technical' },
                  { title: 'Panoramisch', value: 'panoramic' },
                  { title: 'Snelweg', value: 'highway' },
                  { title: 'Binnendoor', value: 'backroads' },
                  { title: 'Gemengd', value: 'mixed' },
                ],
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'difficulty',
              title: 'Moeilijkheidsgraad',
              type: 'string',
              options: {
                list: [
                  { title: 'Easy', value: 'easy' },
                  { title: 'Medium', value: 'medium' },
                  { title: 'Hard', value: 'hard' },
                ],
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'estimatedDistance',
              title: 'Geschatte Afstand (km)',
              type: 'number',
              description: 'Afstand van deze specifieke route',
              validation: (Rule) => Rule.required().min(1).max(100),
            },
            {
              name: 'character',
              title: 'Karakter',
              type: 'string',
              description: 'Bijv., "Zeer bochtig", "Rustig verkeer", "Technisch"',
            },
            {
              name: 'warnings',
              title: 'Aandachtspunten',
              type: 'text',
              rows: 2,
              description: 'Waarschuwingen: gravel, smal, druk verkeer, etc.',
            },
            {
              name: 'highlights',
              title: 'Highlights',
              type: 'text',
              rows: 2,
              description: 'Scenic points, foto spots, aanraders',
            },
            {
              name: 'exitInstructions',
              title: 'Startpunt Instructies',
              type: 'text',
              rows: 2,
              description: 'Waar en hoe verlaat je de hoofdroute?',
            },
            {
              name: 'routeInstructions',
              title: 'Route Instructies',
              type: 'text',
              rows: 4,
              description: 'Gedetailleerde route beschrijving',
            },
            {
              name: 'rejoinInstructions',
              title: 'Eindpunt Instructies',
              type: 'text',
              rows: 2,
              description: 'Hoe kom je terug op de hoofdroute?',
            },
            {
              name: 'gpxFile',
              title: 'GPX Bestand',
              type: 'file',
              description: 'Optioneel GPX bestand voor deze specifieke route',
              options: {
                accept: '.gpx',
              },
            },
            {
              name: 'locations',
              title: 'Route Punten',
              type: 'array',
              description: 'Geografische punten die deze route markeren op de kaart',
              of: [
                {
                  type: 'object',
                  name: 'routeLocation',
                  fields: [
                    {
                      name: 'name',
                      title: 'Punt Naam',
                      type: 'string',
                      description: 'Bijv., "Start", "Kempische Heuvelrug", "Foto Spot"',
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: 'coordinates',
                      title: 'Coördinaten',
                      type: 'object',
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
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: 'type',
                      title: 'Type Punt',
                      type: 'string',
                      description: 'Wat voor soort punt is dit?',
                      options: {
                        list: [
                          { title: 'Start', value: 'start' },
                          { title: 'Eind', value: 'end' },
                          { title: 'Highlight', value: 'highlight' },
                          { title: 'Waarschuwing', value: 'warning' },
                          { title: 'Foto Spot', value: 'photo' },
                          { title: 'Waypoint', value: 'waypoint' },
                        ],
                      },
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: 'description',
                      title: 'Beschrijving',
                      type: 'text',
                      rows: 2,
                      description: 'Optionele extra info over dit punt',
                    },
                    {
                      name: 'challenge',
                      title: 'Opdracht',
                      type: 'object',
                      description: 'Optionele opdracht die deelnemers op deze locatie kunnen voltooien',
                      fields: [
                        {
                          name: 'type',
                          title: 'Type Opdracht',
                          type: 'string',
                          options: {
                            list: [
                              { title: 'Foto Opdracht', value: 'photo' },
                              { title: 'Tekst Vraag', value: 'text' },
                              { title: 'Multiple Choice', value: 'multiple_choice' },
                              { title: 'Getal', value: 'number' },
                            ],
                          },
                          validation: (Rule) => Rule.required(),
                        },
                        {
                          name: 'question',
                          title: 'Vraag/Instructie',
                          type: 'text',
                          rows: 3,
                          description: 'Bijv: "Wat staat er op de kerk?" of "Maak een foto van het uitzicht"',
                          validation: (Rule) => Rule.required(),
                        },
                        {
                          name: 'hint',
                          title: 'Hint',
                          type: 'text',
                          rows: 2,
                          description: 'Optionele hint voor de deelnemer',
                        },
                        {
                          name: 'options',
                          title: 'Antwoord Opties',
                          type: 'array',
                          of: [{ type: 'string' }],
                          description: 'Voor multiple choice: lijst van mogelijke antwoorden',
                          hidden: ({ parent }) => parent?.type !== 'multiple_choice',
                        },
                        {
                          name: 'correctAnswer',
                          title: 'Correct Antwoord',
                          type: 'string',
                          description: 'Voor automatische validatie. Laat leeg voor handmatige controle.',
                        },
                        {
                          name: 'points',
                          title: 'Punten',
                          type: 'number',
                          description: 'Aantal punten voor correcte inzending',
                          initialValue: 5,
                          validation: (Rule) => Rule.required().min(0),
                        },
                        {
                          name: 'isActive',
                          title: 'Actief',
                          type: 'boolean',
                          description: 'Is deze opdracht momenteel actief?',
                          initialValue: true,
                        },
                      ],
                      preview: {
                        select: {
                          type: 'type',
                          question: 'question',
                          points: 'points',
                        },
                        prepare(selection) {
                          const { type, question, points } = selection;
                          const typeLabel: Record<string, string> = {
                            photo: '📸',
                            text: '✍️',
                            multiple_choice: '☑️',
                            number: '🔢',
                          };
                          return {
                            title: `${typeLabel[type as string] || '❓'} ${question?.substring(0, 50)}...`,
                            subtitle: `${points} punten`,
                          };
                        },
                      },
                    },
                  ],
                  preview: {
                    select: {
                      title: 'name',
                      subtitle: 'type',
                      lat: 'coordinates.lat',
                      lng: 'coordinates.lng',
                      hasChallenge: 'challenge',
                    },
                    prepare(selection) {
                      const { title, subtitle, lat, lng, hasChallenge } = selection;
                      const challengeIcon = hasChallenge ? ' 🎯' : '';
                      return {
                        title: `${title}${challengeIcon}`,
                        subtitle: `${subtitle} - ${lat?.toFixed(4)}, ${lng?.toFixed(4)}`,
                      };
                    },
                  },
                },
              ],
            },
            {
              name: 'color',
              title: 'Kaart Kleur',
              type: 'string',
              description: 'Kleur voor deze route op de kaart (hex code)',
              validation: (Rule) => Rule.regex(/^#[0-9A-Fa-f]{6}$/, { name: 'hex color' }),
            },
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'routeType',
              distance: 'estimatedDistance',
            },
            prepare(selection) {
              const { title, subtitle, distance } = selection;
              return {
                title,
                subtitle: `${subtitle} - ${distance}km`,
              };
            },
          },
        },
      ],
      validation: (Rule) => Rule.min(1),
    }),
    // Legacy fields for backwards compatibility
    defineField({
      name: 'exit',
      title: 'Exit Instructions (Legacy)',
      type: 'text',
      hidden: true,
    }),
    defineField({
      name: 'lus',
      title: 'Lus Instructions (Legacy)',
      type: 'text',
      hidden: true,
    }),
    defineField({
      name: 'estimatedDistance',
      title: 'Estimated Distance (Legacy)',
      type: 'number',
      hidden: true,
    }),
    defineField({
      name: 'rejoin',
      title: 'Rejoin Instructions (Legacy)',
      type: 'text',
      hidden: true,
    }),
    defineField({
      name: 'checkpoints',
      title: 'Checkpoints (Legacy)',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'name', type: 'string' },
            { name: 'description', type: 'text' },
          ],
        },
      ],
      hidden: true,
    }),
    defineField({
      name: 'checkpoint',
      title: 'Checkpoint (Legacy)',
      type: 'string',
      hidden: true,
    }),
    defineField({
      name: 'codeHint',
      title: 'Code Hint (Legacy)',
      type: 'string',
      hidden: true,
    }),
    defineField({
      name: 'solution',
      title: 'Solution Code (Legacy)',
      type: 'string',
      hidden: true,
    }),
    defineField({
      name: 'validAnswers',
      title: 'Valid Answers (Legacy)',
      type: 'array',
      of: [{ type: 'string' }],
      hidden: true,
    }),
    defineField({
      name: 'points',
      title: 'Base Points (Legacy)',
      type: 'number',
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
