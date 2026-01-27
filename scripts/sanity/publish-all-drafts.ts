/**
 * Publish All Draft Documents
 * Makes all draft content live
 */

import { sanityClient } from './00-config';

async function publishAllDrafts() {
  console.log('📤 Publishing all draft documents...\n');

  const drafts = await sanityClient.fetch(`
    *[_id in path("drafts.**")] {
      _id,
      _type,
      title
    }
  `);

  if (drafts.length === 0) {
    console.log('✅ No drafts found - everything is already published!\n');
    return;
  }

  console.log(`Found ${drafts.length} draft(s):\n`);

  for (const draft of drafts) {
    const draftId = draft._id;
    const publishedId = draftId.replace('drafts.', '');

    console.log(`📄 ${draft._type}: ${draft.title || publishedId}`);

    const fullDraft = await sanityClient.getDocument(draftId);
    if (!fullDraft) {
      console.log(`   ⚠️  Not found, skipping`);
      continue;
    }

    const { _id, _rev, ...documentToPublish } = fullDraft;

    await sanityClient.createOrReplace({
      ...documentToPublish,
      _id: publishedId,
    });

    console.log(`   ✓ Published as: ${publishedId}`);
  }

  console.log('\n✅ All drafts published!\n');
}

publishAllDrafts().catch(console.error);
