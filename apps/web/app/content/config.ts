// Content bestand voor algemene site configuratie
// Pas dit bestand aan om teksten/info te updaten

export const siteConfig = {
  // Event informatie
  event: {
    name: 'Deur Den Bocht',
    tagline: 'Den Bochtenkoning Rally',
    edition: 'Den tweede keer Deur den Bocht',
    date: '2026-05-16',
    dateFormatted: 'ZONDAG 16/05/2026',
    location: 'Café Den Belami, Aalter',
    callToAction: 'Gade mee? Tot aan café Belami, Aalter!',
  },

  // Stats
  stats: [
    { value: '500+', label: 'Kilometer' },
    { value: '8', label: 'Rally Zones' },
    { value: '3', label: 'Landen' },
    { value: '0', label: 'Snelheid' },
  ],

  // Prijzen
  pricing: {
    withMeals: {
      price: 20,
      title: 'Met Maaltijden',
      emoji: '🍽️',
      features: [
        'Ontbijt in café Belami',
        'Warme maaltijd onderweg',
        'Avondmaal bij aankomst',
        'GPX routes & Bochtenboek',
        'Rally deelname',
      ],
    },
    breakfastOnly: {
      price: 10,
      title: 'Enkel Ontbijt',
      emoji: '☕',
      features: [
        'Ontbijt in café Belami',
        'GPX routes & Bochtenboek',
        'Rally deelname',
      ],
      excludedFeatures: [
        'Warme maaltijd onderweg',
        'Avondmaal bij aankomst',
      ],
    },
  },

  // Contact
  contact: {
    email: 'info@deurdenbocht.be',
    whatsapp: 'Via WhatsApp groep',
    location: 'Café Den Belami, Aalter',
  },

  // Social media (optioneel - later toe te voegen)
  social: {
    facebook: '',
    instagram: '',
  },
};
