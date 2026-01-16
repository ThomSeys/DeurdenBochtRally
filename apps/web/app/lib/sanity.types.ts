// Sanity Content Types
export interface Edition {
  _id: string;
  year: number;
  name: string;
  slug: { current: string };
  isActive: boolean;
  eventDate: string;
  registrationOpen: boolean;
}

export interface Sponsor {
  _id: string;
  name: string;
  logo: any;
  website?: string;
  order: number;
}

export interface SiteConfig {
  _id: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  eventTagline?: string;
  contactEmail?: string;
  contactWhatsapp?: string;
  contactLocation?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  socialStrava?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoImage?: any;
  heroBackgroundImage?: any;
  featureImage1?: any;
  featureImage2?: any;
  featureImage3?: any;
}

export interface Stat {
  _id: string;
  label: string;
  value: string;
  icon?: string;
  order: number;
}

export interface PricingTier {
  _id: string;
  name: string;
  price: number;
  icon?: string;
  features?: string[];
  highlighted?: boolean;
  order: number;
}

export type ZoneType = 'short' | 'medium' | 'long';

export interface Checkpoint {
  _key?: string;
  name: string;
  description: string;
  codeHint: string;
  solution: string;
  validAnswers: string[];
  location?: {
    lat: number;
    lng: number;
  };
}

export interface RallyZone {
  _id: string;
  title: string;
  description: string;
  location: string;
  zoneType: ZoneType;
  estimatedDistance: number;
  exit: string;
  lus: string;
  rejoin: string;
  checkpoints: Checkpoint[];
  // Legacy fields (hidden but kept for backward compatibility)
  checkpoint?: string;
  codeHint?: string;
  solution?: string;
  points: number;
  color: 'green' | 'yellow' | 'orange' | 'red';
  image?: any;
  zoneNumber: number;
}

export interface ScheduleItem {
  _id: string;
  time: string;
  title: string;
  description: string;
  icon?: string;
  color?: string;
  details?: string[];
  order: number;
}

export interface FAQItem {
  _id: string;
  question: string;
  answer: string;
  category: string;
  icon?: string;
  order: number;
}

export interface BenefitItem {
  _id: string;
  title: string;
  description: string;
  icon: string;
  category: 'everyone' | 'winner';
  order: number;
}

export interface PageContent {
  _id: string;
  page: string;
  section: string;
  title: string;
  content?: any[];
  order: number;
}
