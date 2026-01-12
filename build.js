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

// Copy server build to function
cpSync('build/server', join(vercelOutput, 'functions/index.func'), { recursive: true });

// Create function config
writeFileSync(
  join(vercelOutput, 'functions/index.func/.vc-config.json'),
  JSON.stringify({
    runtime: 'nodejs20.x',
    handler: 'index.js',
    launcherType: 'Nodejs'
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