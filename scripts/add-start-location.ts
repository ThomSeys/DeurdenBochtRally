import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  token: process.env.SANITY_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

async function addStartLocation() {
  try {
    const result = await client
      .patch('al9YZDTZ31vRTK71LFVTTR') // siteConfig document ID
      .set({
        startLocation: {
          lat: 51.0967,
          lng: 3.4400,
          label: 'Café Den Belami, Aalter'
        }
      })
      .commit();

    console.log('✓ Added start location coordinates to siteConfig');
    console.log(result);
  } catch (error) {
    console.error('Error adding start location:', error);
  }
}

addStartLocation();
