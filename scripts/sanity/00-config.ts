/**
 * Sanity Configuration
 * Shared config for all Sanity scripts
 */

import { createClient } from '@sanity/client';
import 'dotenv/config';

// Get token from environment
const SANITY_TOKEN = process.env.SANITY_TOKEN || '';

if (!SANITY_TOKEN) {
  throw new Error('SANITY_TOKEN environment variable is required');
}

export const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || '',
  dataset: process.env.SANITY_DATASET || 'production',
  token: SANITY_TOKEN,
  apiVersion: '2023-05-03',
  useCdn: false,
});

// Local GPX file path
import { resolve } from 'path';
export const MAIN_GPX_PATH = resolve(__dirname, '../../apps/web/public/gpx/Deur den Bocht Rally.gpx');

export interface Point {
  lat: number;
  lng: number;
}
