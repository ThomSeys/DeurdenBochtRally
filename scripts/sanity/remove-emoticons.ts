import { createClient } from '@sanity/client';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local from apps/web
config({ path: resolve(__dirname, '../../apps/web/.env.local') });

const client = createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  useCdn: false,
  token: process.env.SANITY_TOKEN,
  apiVersion: '2024-01-01',
});

const iconReplacements: Record<string, string> = {
  '🛡️': 'shield',
  '🍽️': 'utensils',
  '✅': 'check',
  '☕': 'coffee',
  '🏁': 'flag',
  '🍔': 'utensils',
  '🏔️': 'mountain',
  '🎉': 'party',
  '🗺️': 'map',
  '🚨': 'alert',
  '🏍️': 'motorcycle',
  '🎯': 'target',
  '💰': 'money',
  '👤': 'user',
  '📋': 'clipboard',
  '📱': 'phone',
  '↩️': 'arrow-back',
  '📖': 'book',
  '📸': 'camera',
  '🏅': 'award',
};

const documentsToUpdate = [
  // scheduleItems
  { id: '6ls5v56EbOuIS4pXHwCvwS', icon: '🛡️' },
  { id: '6ls5v56EbOuIS4pXHwCxDW', icon: '🍽️' },
  { id: 'dP9gN8tmqv0LMQF0JHKmGd', icon: '✅' },
  { id: 'uKUSe7ggQXp6fRmiJ0xS3D', icon: '☕' },
  { id: 'uKUSe7ggQXp6fRmiJ0xSn5', icon: '🏁' },
  { id: 'uKUSe7ggQXp6fRmiJ0xTA1', icon: '🍔' },
  { id: 'uKUSe7ggQXp6fRmiJ0xTPJ', icon: '🏔️' },
  { id: 'uKUSe7ggQXp6fRmiJ0xUD0', icon: '🎉' },
  // faqItems
  { id: '6ls5v56EbOuIS4pXHwCytY', icon: '🗺️' },
  { id: '6ls5v56EbOuIS4pXHwD0sJ', icon: '🚨' },
  { id: 'dP9gN8tmqv0LMQF0JHKo2r', icon: '🏍️' },
  { id: 'dP9gN8tmqv0LMQF0JHKolH', icon: '🎯' },
  { id: 'dP9gN8tmqv0LMQF0JHKp3N', icon: '💰' },
  { id: 'dP9gN8tmqv0LMQF0JHKp9x', icon: '👤' },
  { id: 'uKUSe7ggQXp6fRmiJ0xXLx', icon: '📋' },
  { id: 'uKUSe7ggQXp6fRmiJ0xXbF', icon: '📱' },
  { id: 'uKUSe7ggQXp6fRmiJ0xaNG', icon: '↩️' },
  // benefitItems
  { id: '6ls5v56EbOuIS4pXHwD1B2', icon: '📖' },
  { id: '6ls5v56EbOuIS4pXHwD213', icon: '📸' },
  { id: '6ls5v56EbOuIS4pXHwD2Hh', icon: '🏅' },
  { id: '6ls5v56EbOuIS4pXHwD2aQ', icon: '☕' },
  { id: '6ls5v56EbOuIS4pXHwD2zO', icon: '🛡️' },
  { id: 'dP9gN8tmqv0LMQF0JHKqzT', icon: '📱' },
  { id: 'dP9gN8tmqv0LMQF0JHKs4v', icon: '🏔️' },
  { id: 'uKUSe7ggQXp6fRmiJ0xb78', icon: '🗺️' },
  { id: 'uKUSe7ggQXp6fRmiJ0xcDw', icon: '🚨' },
  { id: 'uKUSe7ggQXp6fRmiJ0xe8R', icon: '🎉' },
  // pricingTiers
  { id: 'dP9gN8tmqv0LMQF0JHKlvF', icon: '☕' },
  { id: 'uKUSe7ggQXp6fRmiJ0xRJL', icon: '🍽️' },
];

async function updateIcons() {
  console.log('Starting icon updates...');
  
  for (const doc of documentsToUpdate) {
    const newIcon = iconReplacements[doc.icon];
    if (!newIcon) {
      console.log(`No replacement found for ${doc.icon} in document ${doc.id}`);
      continue;
    }

    try {
      await client
        .patch(doc.id)
        .set({ icon: newIcon })
        .commit();
      
      console.log(`✓ Updated ${doc.id}: ${doc.icon} → ${newIcon}`);
    } catch (error) {
      console.error(`✗ Failed to update ${doc.id}:`, error);
    }
  }
  
  console.log('\nDone!');
}

updateIcons().catch(console.error);
