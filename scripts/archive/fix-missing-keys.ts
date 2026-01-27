import { createClient } from '@sanity/client';
import { v4 as uuidv4 } from 'uuid';

const client = createClient({
  projectId: 'vwvwbgax',
  dataset: 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

async function addMissingKeys() {
  try {
    // Fetch all pageContent documents
    const documents = await client.fetch(`*[_type == "pageContent"]`);
    
    console.log(`Found ${documents.length} pageContent documents`);
    
    for (const doc of documents) {
      if (!doc.content) continue;
      
      let needsUpdate = false;
      const updatedContent = doc.content.map((block: any) => {
        if (!block._key) {
          needsUpdate = true;
          return {
            ...block,
            _key: uuidv4(),
          };
        }
        return block;
      });
      
      if (needsUpdate) {
        console.log(`Updating document ${doc._id}...`);
        await client
          .patch(doc._id)
          .set({ content: updatedContent })
          .commit();
        console.log(`✅ Updated ${doc._id}`);
      } else {
        console.log(`⏭️  Skipping ${doc._id} - no missing keys`);
      }
    }
    
    console.log('✨ Done!');
  } catch (error) {
    console.error('Error:', error);
  }
}

addMissingKeys();
