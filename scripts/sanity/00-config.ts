/**
 * Sanity Configuration
 * Shared config for all Sanity scripts
 */

import { createClient } from '@sanity/client';

// Get token from environment or use hardcoded (for now)
const SANITY_TOKEN = process.env.SANITY_TOKEN || 'skaD4StBLox7QnIavzjPBYrPNjemIOMgeeGzq8IECjOsmGMUQdQ4QXLifygEqOlL5lTxlMORN21tvsR1kUrkSvHbhe45pZnAwZXfsS0EEiCl9MSyTOoNYXQgCBH3vSdIyvY3YZ7ZCP5jznUPGXxphuG5IGG0TEXstNsIuT84bBKn0RLDRYGs';

export const sanityClient = createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
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
