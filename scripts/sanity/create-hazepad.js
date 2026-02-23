#!/usr/bin/env node
/**
 * Small helper to create Hazepad content in Sanity.
 * Usage: SANITY_TOKEN=... node scripts/sanity/create-hazepad.js
 */
const client = require('@sanity/client');
const fs = require('fs');

const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID || 'tp2nrvnd';
const SANITY_DATASET = process.env.SANITY_DATASET || 'production';
const SANITY_TOKEN = process.env.SANITY_TOKEN;

if (!SANITY_TOKEN) {
  console.error('Please set SANITY_TOKEN environment variable with write permissions.');
  process.exit(1);
}

const sanity = client({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: SANITY_TOKEN,
  useCdn: false,
});

async function run() {
  const hazepadContent = {
    _type: 'faqItem',
    question: 'Wat is Hazepad?',
    answer: `Hazepad is een eenvoudige, collaboratieve notitie- en checklist-app die teams helpt om snel problemen, observaties en korte instructies te delen tijdens evenementen. Gebruik dit item als referentie.`,
    category: 'general',
  };

  try {
    const created = await sanity.create(hazepadContent);
    console.log('Created FAQ item in Sanity:', created._id);
  } catch (err) {
    console.error('Failed to create document in Sanity:', err.message || err);
    process.exit(1);
  }
}

run();
