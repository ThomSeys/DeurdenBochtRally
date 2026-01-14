const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

async function updateEventDate() {
  console.log('📅 Updating event date to 2026-08-08...\n');

  try {
    // Find the 2026 edition
    const edition = await client.fetch(`*[_type == "edition" && year == 2026][0]`);
    
    if (!edition) {
      console.log('❌ Edition not found');
      return;
    }

    console.log(`✅ Found edition: ${edition.name} (ID: ${edition._id})`);
    
    // Update the event date
    const updated = await client
      .patch(edition._id)
      .set({
        eventDate: '2026-08-08'
      })
      .commit();
    
    console.log(`✅ Updated event date to 2026-08-08`);
    console.log(`📅 New event date: ${updated.eventDate}\n`);
  } catch (error) {
    console.error('❌ Error updating event date:', error);
    process.exit(1);
  }
}

updateEventDate();
