import type { Config } from "@react-router/dev/config";

export default {
  // Server-side render by default
  ssr: true,
  
  // Configure for Vercel serverless deployment
  serverBuildFile: "index.js",
  serverModuleFormat: "esm",
  
  // Vercel-specific build configuration
  buildDirectory: "build",
} satisfies Config;
