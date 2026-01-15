import { createRequestListener } from "@react-router/node";
import * as build from "../build/server/index.js";

const listener = createRequestListener({ build });

export default async function handler(req, res) {
  // Set cache headers for HTML pages (don't cache)
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  
  // Allow stale content while revalidating
  res.setHeader('Surrogate-Control', 'public, max-age=60');
  
  return listener(req, res);
}