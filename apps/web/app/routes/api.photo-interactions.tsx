import type { ActionFunctionArgs } from 'react-router';
import { supabaseAdmin } from '~/lib/supabase.server';
import { requireUserId } from '~/lib/session.server';
import { createRequestLogger } from '~/lib/logger.server';

async function isAcceptedBuddy(userId: string, otherId: string) {
  const { data, error } = await supabaseAdmin
    .from('riding_buddies')
    .select('id')
    .or(`and(participant_id.eq.${userId},buddy_id.eq.${otherId},status.eq.accepted),and(participant_id.eq.${otherId},buddy_id.eq.${userId},status.eq.accepted)`)
    .single();

  if (error && error.code !== 'PGRST116') {
    return false;
  }

  return Boolean(data);
}

async function getPhotoSnapshot(photoId: string, userId: string) {
  const { data: photo, error: photoError } = await supabaseAdmin
    .from('participant_photos')
    .select(
      'id, like_count, photo_tags(participant_id, participant:participants!photo_tags_participant_id_fkey(id, first_name, last_name))'
    )
    .eq('id', photoId)
    .single();

  if (photoError || !photo) {
    return null;
  }

  const { data: like, error: likeError } = await supabaseAdmin
    .from('photo_likes')
    .select('id')
    .eq('photo_id', photoId)
    .eq('participant_id', userId)
    .single();

  if (likeError && likeError.code !== 'PGRST116') {
    return null;
  }

  return {
    like_count: photo.like_count || 0,
    tags: photo.photo_tags || [],
    liked: Boolean(like),
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const requestLogger = createRequestLogger(request, userId);

  const contentType = request.headers.get('content-type') || '';
  let action: string | null = null;
  let photoId: string | null = null;
  let taggedParticipantId: string | null = null;

  if (contentType.includes('application/json')) {
    const body = await request.json();
    action = body.action;
    photoId = body.photoId;
    taggedParticipantId = body.taggedParticipantId || null;
  } else {
    const formData = await request.formData();
    action = formData.get('action') as string | null;
    photoId = formData.get('photo_id') as string | null;
    taggedParticipantId = (formData.get('tagged_participant_id') as string | null) || null;
  }

  if (!action || !photoId) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data: photo, error: photoError } = await supabaseAdmin
    .from('participant_photos')
    .select('id, participant_id, like_count')
    .eq('id', photoId)
    .single();

  if (photoError || !photo) {
    await requestLogger.warn('photo-interactions', 'Photo not found', { photoId });
    return Response.json({ error: 'Photo not found' }, { status: 404 });
  }

  const ownerId = photo.participant_id;
  const isOwner = ownerId === userId;
  const isBuddy = await isAcceptedBuddy(userId, ownerId);

  if (!isOwner && !isBuddy) {
    return Response.json({ error: 'Not allowed' }, { status: 403 });
  }

  if (action === 'snapshot') {
    const snapshot = await getPhotoSnapshot(photoId, userId);
    return Response.json({ success: true, snapshot });
  }

  if (action === 'like') {
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('photo_likes')
      .select('id')
      .eq('photo_id', photoId)
      .eq('participant_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      return Response.json({ error: 'Failed to check like' }, { status: 500 });
    }

    if (existing) {
      const { error: deleteError } = await supabaseAdmin
        .from('photo_likes')
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        return Response.json({ error: 'Failed to unlike' }, { status: 500 });
      }

      const { error: rpcError } = await supabaseAdmin.rpc('decrement_photo_likes', { photo_id: photoId });
      if (rpcError) {
        const nextCount = Math.max((photo.like_count || 0) - 1, 0);
        await supabaseAdmin
          .from('participant_photos')
          .update({ like_count: nextCount })
          .eq('id', photoId);
      }

      const snapshot = await getPhotoSnapshot(photoId, userId);
      return Response.json({ success: true, liked: false, snapshot });
    }

    const { error: insertError } = await supabaseAdmin
      .from('photo_likes')
      .insert({ photo_id: photoId, participant_id: userId });

    if (insertError) {
      return Response.json({ error: 'Failed to like' }, { status: 500 });
    }

    const { error: rpcError } = await supabaseAdmin.rpc('increment_photo_likes', { photo_id: photoId });
    if (rpcError) {
      await supabaseAdmin
        .from('participant_photos')
        .update({ like_count: (photo.like_count || 0) + 1 })
        .eq('id', photoId);
    }

    const snapshot = await getPhotoSnapshot(photoId, userId);
    return Response.json({ success: true, liked: true, snapshot });
  }

  if (action === 'tag') {
    if (!taggedParticipantId) {
      return Response.json({ error: 'Tagged participant required' }, { status: 400 });
    }

    const canTag = isOwner || (await isAcceptedBuddy(userId, ownerId));
    if (!canTag) {
      return Response.json({ error: 'Not allowed to tag this participant' }, { status: 403 });
    }

    const { error: tagError } = await supabaseAdmin
      .from('photo_tags')
      .insert({
        photo_id: photoId,
        participant_id: taggedParticipantId,
        tagged_by: userId,
      });

    if (tagError) {
      if (tagError.code === '23505') {
        return Response.json({ error: 'Already tagged' }, { status: 409 });
      }
      return Response.json({ error: 'Failed to tag' }, { status: 500 });
    }

    const snapshot = await getPhotoSnapshot(photoId, userId);
    return Response.json({ success: true, snapshot });
  }

  if (action === 'untag') {
    if (!taggedParticipantId) {
      return Response.json({ error: 'Tagged participant required' }, { status: 400 });
    }

    const canTag = isOwner || (await isAcceptedBuddy(userId, ownerId));
    if (!canTag) {
      return Response.json({ error: 'Not allowed to untag this participant' }, { status: 403 });
    }

    const { error: untagError } = await supabaseAdmin
      .from('photo_tags')
      .delete()
      .eq('photo_id', photoId)
      .eq('participant_id', taggedParticipantId);

    if (untagError) {
      return Response.json({ error: 'Failed to remove tag' }, { status: 500 });
    }

    const snapshot = await getPhotoSnapshot(photoId, userId);
    return Response.json({ success: true, snapshot });
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 });
}
