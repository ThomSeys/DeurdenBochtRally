import { createImageUrlBuilder } from '@sanity/image-url';

const projectId = 'tp2nrvnd';
const dataset = 'production';

// Client-safe image URL builder
const builder = createImageUrlBuilder({ projectId, dataset });

export function urlFor(source: any) {
  return builder.image(source);
}
