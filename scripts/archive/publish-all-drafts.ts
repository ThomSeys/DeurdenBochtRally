import { createClient } from '@sanity/client';
import 'dotenv/config';

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || '',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN || '',
  apiVersion: '2023-05-03',
  useCdn: false,
});

async function publishAllDrafts() {
  console.log('📤 Publishing all draft documents...\n');
  
  // Find all draft documents
  const drafts = await client.fetch(`
    *[_id in path("drafts.**")] {
      _id,
      _type,
      title
    }
  `);
  
  if (drafts.length === 0) {
    console.log('✅ No drafts found - everything is already published!');
    return;
  }
  
  console.log(`Found ${drafts.length} draft(s) to publish:\n`);
  
  for (const draft of drafts) {
    const draftId = draft._id;
    const publishedId = draftId.replace('drafts.', '');
    
    console.log(`📄 ${draft._type}: ${draft.title || publishedId}`);
    console.log(`   Draft ID: ${draftId}`);
    
    // Get the full draft document
    const fullDraft = await client.getDocument(draftId);
    
    if (!fullDraft) {
      console.log(`   ⚠️  Draft not found, skipping`);
      continue;
    }
    
    // Remove draft-specific fields
    const { _id, _rev, ...documentToPublish } = fullDraft;
    
    try {
      // Create or replace the published version
      await client.createOrReplace({
        ...documentToPublish,
        _id: publishedId,
        _type: draft._type,
      });
      
      console.log(`   ✅ Published to ${publishedId}`);
      
      // Delete the draft
      await client.delete(draftId);
      console.log(`   ✅ Deleted draft\n`);
      
    } catch (error) {
      console.log(`   ❌ Error publishing:`, error);
    }
  }
  
  console.log('✨ Done!');
}

publishAllDrafts().catch(console.error);
