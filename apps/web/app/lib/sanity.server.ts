import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

if (!process.env.SANITY_PROJECT_ID) {
  throw new Error('SANITY_PROJECT_ID is required');
}

if (!process.env.SANITY_DATASET) {
  throw new Error('SANITY_DATASET is required');
}

export const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: true,
  token: process.env.SANITY_TOKEN,
});

const builder = imageUrlBuilder(sanityClient);

export function urlFor(source: any) {
  return builder.image(source);
}

// Query helpers for common content
export async function getActiveEdition() {
  return sanityClient.fetch(
    `*[_type == "edition" && isActive == true][0]{ 
      _id, 
      year, 
      name, 
      eventDate, 
      registrationOpen 
    }`
  );
}

export async function getSiteConfig() {
  return sanityClient.fetch(
    `*[_type == "siteConfig"][0]{
      _id,
      eventName,
      eventDate,
      eventLocation,
      startLocation,
      eventTagline,
      contactEmail,
      contactWhatsapp,
      contactLocation,
      socialFacebook,
      socialInstagram,
      socialStrava,
      seoTitle,
      seoDescription,
      seoImage{
        asset->{
          _id,
          url
        }
      },
      heroBackgroundImage{
        asset->{
          _id,
          url
        }
      },
      featureImage1{
        asset->{
          _id,
          url
        }
      },
      featureImage2{
        asset->{
          _id,
          url
        }
      },
      featureImage3{
        asset->{
          _id,
          url
        }
      },
      noIndex,
      noFollow
    }`
  );
}

export async function getPricingTiers(editionId: string) {
  return sanityClient.fetch(
    `*[_type == "pricingTier" && edition._ref == $editionId] | order(order asc)`,
    { editionId }
  );
}

export async function getSponsors(editionId: string) {
  return sanityClient.fetch(
    `*[_type == "sponsor" && edition._ref == $editionId] | order(order asc){
      _id,
      name,
      logo,
      website,
      order
    }`,
    { editionId }
  );
}

export async function getRallyZones(editionId: string) {
  return sanityClient.fetch(
    `*[_type == "rallyZone" && edition._ref == $editionId] | order(zoneNumber asc){
      _id,
      title,
      description,
      location,
      exit,
      lus,
      checkpoint,
      codeHint,
      rejoin,
      points,
      solution,
      color,
      image,
      zoneNumber,
      startPoint,
      endPoint,
      zoneType,
      estimatedDistance,
      checkpoints[] {
        name,
        trajectory,
        description,
        codeHint,
        solution,
        validAnswers,
        location
      }
    }`,
    { editionId }
  );
}

export async function getScheduleItems(editionId: string) {
  return sanityClient.fetch(
    `*[_type == "scheduleItem" && edition._ref == $editionId] | order(order asc)`,
    { editionId }
  );
}

export async function getStats(editionId: string) {
  return sanityClient.fetch(
    `*[_type == "stat" && edition._ref == $editionId] | order(order asc)`,
    { editionId }
  );
}

export async function getFeatureCards(editionId: string, section: string) {
  return sanityClient.fetch(
    `*[_type == "featureCard" && edition._ref == $editionId && section == $section] | order(order asc)`,
    { editionId, section }
  );
}

export async function getFAQItems(editionId: string) {
  return sanityClient.fetch(
    `*[_type == "faqItem" && edition._ref == $editionId] | order(order asc)`,
    { editionId }
  );
}

export async function getBenefitItems(editionId: string, category?: string) {
  const query = category
    ? `*[_type == "benefitItem" && edition._ref == $editionId && category == $category] | order(order asc)`
    : `*[_type == "benefitItem" && edition._ref == $editionId] | order(order asc)`;
  
  return sanityClient.fetch(query, { editionId, category });
}

export async function getPageContent(page: string, editionId: string) {
  return sanityClient.fetch(
    `*[_type == "pageContent" && page == $page && edition._ref == $editionId] | order(order asc)`,
    { page, editionId }
  );
}

