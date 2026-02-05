import { createClient } from '@sanity/client';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load from apps/web/.env.local
dotenv.config({ path: path.resolve(__dirname, '../../apps/web/.env.local') });

const client = createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  useCdn: false,
  token: process.env.SANITY_TOKEN,
  apiVersion: '2024-01-01',
});

async function addTestChallenges() {
  console.log('🎯 Adding test challenges to rally zones...\n');

  const challengesToAdd = [
    {
      docId: 'vlaamse-ardennen',
      routeTipKey: '49b940efb9fe43207060ddfb4c099451',
      locationIndex: 0,
      locationName: 'Paterberg Summit',
      challenge: {
        _type: 'routeChallenge',
        type: 'photo',
        question: 'Maak een foto van jezelf met je motor op de top van de Paterberg. Zorg dat de kasseien goed zichtbaar zijn!',
        hint: 'Parkeer veilig aan de kant. De beste foto\'s maak je met het dal op de achtergrond.',
        points: 10,
        isActive: true,
      },
    },
    {
      docId: 'vlaamse-ardennen',
      routeTipKey: 'a648c3d4ab6b5ce5e6b29188d093c58b',
      locationIndex: 0,
      locationName: 'Stadhuis Oudenaarde',
      challenge: {
        _type: 'routeChallenge',
        type: 'text',
        question: 'In welk jaar werd het stadhuis van Oudenaarde gebouwd? (Kijk naar de gevel)',
        hint: 'Het jaartal staat prominent op de voorgevel vermeld',
        correctAnswer: '1525',
        points: 8,
        isActive: true,
      },
    },
    {
      docId: 'vlaamse-ardennen',
      routeTipKey: 'c8b6c45e48d50373714affde294d73fa',
      locationIndex: 0,
      locationName: 'Kluisberg Top',
      challenge: {
        _type: 'routeChallenge',
        type: 'multiple_choice',
        question: 'Wat is de hoogte van de Kluisberg, het hoogste punt van de Vlaamse Ardennen in Oost-Vlaanderen?',
        options: ['110 meter', '150 meter', '141 meter', '175 meter'],
        correctAnswer: '150 meter',
        hint: 'Het ligt tussen 100 en 200 meter',
        points: 6,
        isActive: true,
      },
    },
    {
      docId: 'condroz',
      routeTipKey: '6ls5v56EbOuIS4pXHwIApB',
      locationIndex: 0,
      locationName: 'Condroz Viewpoint',
      challenge: {
        _type: 'routeChallenge',
        type: 'photo',
        question: 'Maak een foto van het glooiende Condroz-landschap met je motor in beeld',
        hint: 'De mooiste foto\'s vanaf de heuveltoppen waar je het landschap overziet',
        points: 8,
        isActive: true,
      },
    },
    {
      docId: 'ardennen-ourthe',
      routeTipKey: '6ls5v56EbOuIS4pXHwIHIk',
      locationIndex: 0,
      locationName: 'Durbuy Centrum',
      challenge: {
        _type: 'routeChallenge',
        type: 'text',
        question: 'Durbuy wordt vaak genoemd als "de kleinste stad ter wereld". Hoeveel inwoners telt de historische kern ongeveer?',
        hint: 'Het zijn er minder dan 500',
        correctAnswer: '400',
        points: 5,
        isActive: true,
      },
    },
  ];

  for (const item of challengesToAdd) {
    try {
      console.log(`📝 Adding challenge to ${item.docId} - ${item.locationName}...`);

      // First, fetch the current document
      const doc = await client.fetch(
        `*[_type == "rallyZone" && _id == $docId][0]{
          _id,
          routeTips[]{
            _key,
            ...,
            locations[]{
              _key,
              ...
            }
          }
        }`,
        { docId: item.docId }
      );

      if (!doc) {
        console.error(`❌ Document ${item.docId} not found`);
        continue;
      }

      // Find the route tip index
      const routeTipIndex = doc.routeTips?.findIndex((rt: any) => rt._key === item.routeTipKey);
      if (routeTipIndex === -1 || routeTipIndex === undefined) {
        console.error(`❌ Route tip ${item.routeTipKey} not found`);
        continue;
      }

      const routeTip = doc.routeTips[routeTipIndex];

      // Update the location
      if (!routeTip.locations || !routeTip.locations[item.locationIndex]) {
        console.error(`❌ Location index ${item.locationIndex} not found`);
        continue;
      }

      // Use Sanity patch to update the specific location
      await client
        .patch(item.docId)
        .set({
          [`routeTips[${routeTipIndex}].locations[${item.locationIndex}].name`]: item.locationName,
          [`routeTips[${routeTipIndex}].locations[${item.locationIndex}].challenge`]: item.challenge,
        })
        .commit();

      console.log(`✅ Challenge added successfully!\n`);
    } catch (error: any) {
      console.error(`❌ Failed to add challenge to ${item.docId}:`, error.message);
      console.error('Full error:', error);
    }
  }

  console.log('🎉 Done! All test challenges have been added.');
  console.log('\n📱 You can now:');
  console.log('   1. View these challenges in Sanity Studio');
  console.log('   2. Test them on the /rally page');
  console.log('   3. Add more challenges via the Studio UI');
}

addTestChallenges().catch(console.error);
