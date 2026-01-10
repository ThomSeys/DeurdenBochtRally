import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

// Define the schema for our Sanity documents
export type Sponsor = {
  _id: string;
  name: string;
  logo?: {
    asset: {
      _ref: string;
      _type: 'reference';
    };
  };
  logoUrl?: string; // Pre-built URL for client-side use
  website?: string;
  order: number;
};

export type SiteConfig = {
  _id: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  eventTagline: string;
  contactEmail: string;
  contactWhatsapp?: string;
  contactLocation: string;
  socialFacebook?: string;
  socialInstagram?: string;
  socialStrava?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoImage?: {
    asset: {
      _ref: string;
      _type: 'reference';
    };
  };
  seoImageUrl?: string;
  heroBackgroundImage?: any;
  heroBackgroundImageUrl?: string;
  featureImage1?: any;
  featureImage1Url?: string;
  featureImage2?: any;
  featureImage2Url?: string;
  featureImage3?: any;
  featureImage3Url?: string;
  noIndex: boolean;
  noFollow: boolean;
};

export type Stat = {
  _id: string;
  label: string;
  value: string;
  icon: string;
  order: number;
};

export type PricingTier = {
  _id: string;
  name: string;
  price: number;
  icon?: string;
  features: string[];
  highlighted: boolean;
  order: number;
};

export type RallyZone = {
  _id: string;
  title: string;
  description: string;
  location: string;
  exit: string;
  lus: string;
  checkpoint: string;
  codeHint: string;
  rejoin: string;
  points: number;
  solution: string;
  color: 'green' | 'yellow' | 'orange' | 'red';
  image?: {
    asset: {
      _ref: string;
      _type: 'reference';
    };
  };
  order: number;
};

export type PageContent = {
  _id: string;
  page: string;
  section: string;
  title: string;
  content: any[]; // Portable text blocks
  order: number;
};

export type ScheduleItem = {
  _id: string;
  time: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  details?: string[];
  order: number;
};

export type FAQItem = {
  _id: string;
  question: string;
  answer: string;
  category: string;
  icon?: string;
  order: number;
};

export type BenefitItem = {
  _id: string;
  title: string;
  description: string;
  icon: string;
  category: 'everyone' | 'winner';
  order: number;
};

// Initialize the Sanity client
export const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || '',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true, // Use CDN for faster response times
});

// Image URL builder
const builder = imageUrlBuilder(sanityClient);

export function urlFor(source: any) {
  return builder.image(source);
}

// Helper to get image URL as a string for client-side use
export function getImageUrl(source: any, width?: number): string {
  const urlBuilder = builder.image(source);
  if (width) {
    urlBuilder.width(width);
  }
  return urlBuilder.url();
}

// Get active edition
export async function getActiveEdition() {
  try {
    const edition = await sanityClient.fetch(
      `*[_type == "edition" && isActive == true][0] { 
        _id, 
        registrationOpen,
        "pricingTiers": *[_type == "pricingTier" && references(^._id)] | order(order asc) {
          _id,
          name,
          price,
          icon,
          features,
          highlighted,
          order
        }
      }`
    );
    return edition;
  } catch (error) {
    console.error('Error fetching active edition:', error);
    return null;
  }
}

// Helper function to get all sponsors
export async function getSponsors(): Promise<Sponsor[]> {
  try {
    const edition = await getActiveEdition();
    const editionId = edition?._id;
    const query = editionId 
      ? `*[_type == "sponsor" && edition._ref == $editionId] | order(order asc)`
      : `*[_type == "sponsor"] | order(order asc)`;
    
    const sponsors = await sanityClient.fetch<Sponsor[]>(
      `${query} {
        _id,
        name,
        logo,
        website,
        order
      }`,
      { editionId }
    );
    
    // Build logo URLs on the server side
    return sponsors.map(sponsor => ({
      ...sponsor,
      logoUrl: sponsor.logo ? urlFor(sponsor.logo).width(200).height(80).url() : undefined
    }));
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    return [];
  }
}

// Helper function to get site config
export async function getSiteConfig(): Promise<SiteConfig | null> {
  try {
    const edition = await getActiveEdition();
    const editionId = edition?._id;
    const query = editionId
      ? `*[_type == "siteConfig" && edition._ref == $editionId][0]`
      : `*[_type == "siteConfig"][0]`;
    
    const config = await sanityClient.fetch<SiteConfig>(
      `${query} {
        _id,
        eventName,
        eventDate,
        eventLocation,
        eventTagline,
        contactEmail,
        contactWhatsapp,
        contactLocation,
        socialFacebook,
        socialInstagram,
        socialStrava,
        seoTitle,
        seoDescription,
        seoImage,
        heroBackgroundImage,
        featureImage1,
        featureImage2,
        featureImage3,
        noIndex,
        noFollow
      }`,
      { editionId }
    );
    
    // Build image URLs on the server side
    if (config) {
      const result: any = { ...config };
      
      if (config.seoImage) {
        result.seoImageUrl = urlFor(config.seoImage).width(1200).height(630).url();
      }
      if (config.heroBackgroundImage) {
        result.heroBackgroundImageUrl = urlFor(config.heroBackgroundImage).width(1920).height(1080).url();
      }
      if (config.featureImage1) {
        result.featureImage1Url = urlFor(config.featureImage1).width(800).height(600).url();
      }
      if (config.featureImage2) {
        result.featureImage2Url = urlFor(config.featureImage2).width(600).height(400).url();
      }
      if (config.featureImage3) {
        result.featureImage3Url = urlFor(config.featureImage3).width(600).height(400).url();
      }
      
      return result;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching site config:', error);
    return null;
  }
}

// Helper function to get stats
export async function getStats(): Promise<Stat[]> {
  try {
    const edition = await getActiveEdition();
    const editionId = edition?._id;
    const query = editionId
      ? `*[_type == "stat" && edition._ref == $editionId] | order(order asc)`
      : `*[_type == "stat"] | order(order asc)`;
    
    const stats = await sanityClient.fetch<Stat[]>(
      `${query} {
        _id,
        label,
        value,
        icon,
        order
      }`,
      { editionId }
    );
    return stats;
  } catch (error) {
    console.error('Error fetching stats:', error);
    return [];
  }
}

// Helper function to get pricing tiers
export async function getPricingTiers(): Promise<PricingTier[]> {
  try {
    const edition = await getActiveEdition();
    const editionId = edition?._id;
    const query = editionId
      ? `*[_type == "pricingTier" && edition._ref == $editionId] | order(order asc)`
      : `*[_type == "pricingTier"] | order(order asc)`;
    
    const tiers = await sanityClient.fetch<PricingTier[]>(
      `${query} {
        _id,
        name,
        price,
        icon,
        features,
        highlighted,
        order
      }`,
      { editionId }
    );
    return tiers;
  } catch (error) {
    console.error('Error fetching pricing tiers:', error);
    return [];
  }
}

// Helper function to get rally zones
export async function getRallyZones(): Promise<RallyZone[]> {
  try {
    const edition = await getActiveEdition();
    const editionId = edition?._id;
    const query = editionId
      ? `*[_type == "rallyZone" && edition._ref == $editionId] | order(order asc)`
      : `*[_type == "rallyZone"] | order(order asc)`;
    
    const zones = await sanityClient.fetch<RallyZone[]>(
      `${query} {
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
        order
      }`,
      { editionId }
    );
    return zones;
  } catch (error) {
    console.error('Error fetching rally zones:', error);
    return [];
  }
}

// Helper function to get page content
export async function getPageContent(page: string): Promise<PageContent[]> {
  try {
    const edition = await getActiveEdition();
    const editionId = edition?._id;
    const query = editionId
      ? `*[_type == "pageContent" && page == $page && edition._ref == $editionId] | order(order asc)`
      : `*[_type == "pageContent" && page == $page] | order(order asc)`;
    
    const content = await sanityClient.fetch<PageContent[]>(
      `${query} {
        _id,
        page,
        section,
        title,
        content,
        order
      }`,
      { page, editionId }
    );
    return content;
  } catch (error) {
    console.error('Error fetching page content:', error);
    return [];
  }
}

// Helper function to get schedule items
export async function getScheduleItems(): Promise<ScheduleItem[]> {
  try {
    const edition = await getActiveEdition();
    const editionId = edition?._id;
    const query = editionId
      ? `*[_type == "scheduleItem" && edition._ref == $editionId] | order(order asc)`
      : `*[_type == "scheduleItem"] | order(order asc)`;
    
    const items = await sanityClient.fetch<ScheduleItem[]>(
      `${query} {
        _id,
        time,
        title,
        description,
        icon,
        color,
        details,
        order
      }`,
      { editionId }
    );
    return items;
  } catch (error) {
    console.error('Error fetching schedule items:', error);
    return [];
  }
}

// Helper function to get FAQ items
export async function getFAQItems(category?: string): Promise<FAQItem[]> {
  try {
    const edition = await getActiveEdition();
    const editionId = edition?._id;
    let query = editionId
      ? `*[_type == "faqItem" && edition._ref == $editionId`
      : `*[_type == "faqItem"`;
    
    if (category) {
      query += ` && category == $category`;
    }
    
    query += `] | order(order asc)`;
    
    const items = await sanityClient.fetch<FAQItem[]>(
      `${query} {
        _id,
        question,
        answer,
        category,
        icon,
        order
      }`,
      { editionId, category }
    );
    return items;
  } catch (error) {
    console.error('Error fetching FAQ items:', error);
    return [];
  }
}

// Helper function to get benefit items
export async function getBenefitItems(category?: 'everyone' | 'winner'): Promise<BenefitItem[]> {
  try {
    const edition = await getActiveEdition();
    const editionId = edition?._id;
    let query = editionId
      ? `*[_type == "benefitItem" && edition._ref == $editionId`
      : `*[_type == "benefitItem"`;
    
    if (category) {
      query += ` && category == $category`;
    }
    
    query += `] | order(order asc)`;
    
    const items = await sanityClient.fetch<BenefitItem[]>(
      `${query} {
        _id,
        title,
        description,
        icon,
        category,
        order
      }`,
      { editionId, category }
    );
    return items;
  } catch (error) {
    console.error('Error fetching benefit items:', error);
    return [];
  }
}

