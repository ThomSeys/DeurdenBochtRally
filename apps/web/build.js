import { execSync } from 'child_process';
import { cpSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { build } from 'esbuild';

// Run the React Router build
execSync('npm run build', { stdio: 'inherit' });

// Create Vercel output structure
const vercelOutput = '.vercel/output';
mkdirSync(join(vercelOutput, 'functions/index.func'), { recursive: true });
mkdirSync(join(vercelOutput, 'static'), { recursive: true });

// Copy static assets
cpSync('build/client', join(vercelOutput, 'static'), { recursive: true });

// Bundle the server with all dependencies
await build({
  entryPoints: ['build/server/index.js'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: join(vercelOutput, 'functions/index.func/server.js'),
  external: [],
  banner: {
    js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);'
  }
});

// Create the serverless function handler
const handlerCode = `
import { createRequestHandler } from "@react-router/node";
import * as build from "./server.js";

export default async function handler(req, res) {
  try {
    const requestHandler = createRequestHandler({ build });
    return requestHandler(req, res);
  } catch (error) {
    console.error("Handler error:", error);
    res.status(500).send("Internal Server Error: " + error.message);
  }
}
`;

writeFileSync(
  join(vercelOutput, 'functions/index.func/index.js'),
  handlerCode
);

// Create function config
writeFileSync(
  join(vercelOutput, 'functions/index.func/.vc-config.json'),
  JSON.stringify({
    runtime: 'nodejs20.x',
    handler: 'index.js',
    launcherType: 'Nodejs',
    supportsResponseStreaming: true
  })
);

// Create config.json
writeFileSync(
  join(vercelOutput, 'config.json'),
  JSON.stringify({
    version: 3,
    routes: [
      { handle: 'filesystem' },
      { src: '/(.*)', dest: '/index' }
    ]
  })
);