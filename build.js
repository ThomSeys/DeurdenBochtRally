import { execSync } from 'child_process';
import { cpSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// Run the React Router build
execSync('npm run build', { stdio: 'inherit' });

// Create Vercel output structure
const vercelOutput = '.vercel/output';
mkdirSync(join(vercelOutput, 'functions/index.func'), { recursive: true });
mkdirSync(join(vercelOutput, 'static'), { recursive: true });

// Copy static assets
cpSync('build/client', join(vercelOutput, 'static'), { recursive: true });

// Copy server build
cpSync('build/server', join(vercelOutput, 'functions/index.func/build/server'), { recursive: true });

// Copy necessary dependencies (only React Router packages)
const deps = [
  '@react-router/node',
  '@react-router/server-runtime',
  'react-router'
];

mkdirSync(join(vercelOutput, 'functions/index.func/node_modules'), { recursive: true });

deps.forEach(dep => {
  const depPath = join('node_modules', dep);
  const destPath = join(vercelOutput, 'functions/index.func/node_modules', dep);
  try {
    cpSync(depPath, destPath, { recursive: true });
  } catch (error) {
    console.warn(`Could not copy ${dep}:`, error.message);
  }
});

// Create package.json for the function
writeFileSync(
  join(vercelOutput, 'functions/index.func/package.json'),
  JSON.stringify({
    type: 'module',
    dependencies: {
      '@react-router/node': '*',
      '@react-router/server-runtime': '*',
      'react-router': '*'
    }
  })
);

// Create the serverless function handler
const handlerCode = `
import { createRequestHandler } from "@react-router/node";

export default async function handler(req, res) {
  try {
    const build = await import("./build/server/index.js");
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