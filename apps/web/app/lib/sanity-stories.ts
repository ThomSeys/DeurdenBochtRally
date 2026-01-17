import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

export const sanityClient = createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
});

const builder = imageUrlBuilder(sanityClient);

export function urlForImage(source: any) {
  return builder.image(source);
}

export interface RideStory {
  _id: string;
  _type: 'rideStory';
  title: string;
  slug: { current: string };
  excerpt?: string;
  content: any[];
  heroImage: any;
  participantId: string;
  participantName: string;
  edition: {
    _ref: string;
    name?: string;
  };
  publishedAt: string;
  isApproved: boolean;
  isFeatured: boolean;
  likeCount: number;
  viewCount: number;
}

export async function getRideStories(limit?: number, onlyFeatured = false) {
  let query = `*[_type == "rideStory" && isApproved == true]`;
  
  if (onlyFeatured) {
    query += ` && isFeatured == true`;
  }
  
  query += ` | order(isFeatured desc, publishedAt desc)`;
  
  if (limit) {
    query += `[0...${limit}]`;
  }
  
  query += ` {
    _id,
    title,
    slug,
    excerpt,
    heroImage,
    participantId,
    participantName,
    publishedAt,
    isFeatured,
    likeCount,
    viewCount,
    edition->{name}
  }`;
  
  return sanityClient.fetch<RideStory[]>(query);
}

export async function getRideStoryBySlug(slug: string) {
  const query = `*[_type == "rideStory" && slug.current == $slug && isApproved == true][0] {
    _id,
    title,
    slug,
    excerpt,
    content,
    heroImage,
    participantId,
    participantName,
    publishedAt,
    isFeatured,
    likeCount,
    viewCount,
    edition->{name, year}
  }`;
  
  return sanityClient.fetch<RideStory>(query, { slug });
}

export async function getPendingRideStories() {
  const query = `*[_type == "rideStory" && isApproved == false] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    heroImage,
    participantId,
    participantName,
    publishedAt,
    content
  }`;
  
  return sanityClient.fetch<RideStory[]>(query);
}

export async function getParticipantStories(participantId: string) {
  const query = `*[_type == "rideStory" && participantId == $participantId] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    heroImage,
    participantId,
    participantName,
    publishedAt,
    isApproved,
    isFeatured,
    likeCount,
    viewCount
  }`;
  
  return sanityClient.fetch<RideStory[]>(query, { participantId });
}

export async function createRideStory(data: {
  title: string;
  content: any[];
  heroImageAsset: string;
  participantId: string;
  participantName: string;
  editionRef: string;
  excerpt?: string;
}) {
  const doc = {
    _type: 'rideStory',
    title: data.title,
    slug: {
      _type: 'slug',
      current: data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
    },
    excerpt: data.excerpt || '',
    content: data.content,
    heroImage: {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: data.heroImageAsset,
      },
    },
    participantId: data.participantId,
    participantName: data.participantName,
    edition: {
      _type: 'reference',
      _ref: data.editionRef,
    },
    publishedAt: new Date().toISOString(),
    isApproved: false,
    isFeatured: false,
    likeCount: 0,
    viewCount: 0,
  };
  
  return sanityClient.create(doc);
}

export async function updateStoryApproval(storyId: string, approved: boolean) {
  return sanityClient
    .patch(storyId)
    .set({ isApproved: approved })
    .commit();
}

export async function updateStoryFeatured(storyId: string, featured: boolean) {
  return sanityClient
    .patch(storyId)
    .set({ isFeatured: featured })
    .commit();
}

export async function deleteRideStory(storyId: string) {
  return sanityClient.delete(storyId);
}

export async function incrementStoryView(storyId: string) {
  return sanityClient
    .patch(storyId)
    .inc({ viewCount: 1 })
    .commit();
}

export async function incrementStoryLike(storyId: string) {
  return sanityClient
    .patch(storyId)
    .inc({ likeCount: 1 })
    .commit();
}

export async function decrementStoryLike(storyId: string) {
  return sanityClient
    .patch(storyId)
    .dec({ likeCount: 1 })
    .commit();
}
