import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // Load .env files from the monorepo root (where .env.local lives)
  envDir: "../../",
  plugins: [
    tailwindcss(),
    reactRouter(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "app",
      filename: "sw.ts",
      registerType: "autoUpdate",
      // We register the SW manually in entry.client.tsx
      injectRegister: false,
      // No manifest config here — we serve public/manifest.webmanifest as a static
      // file so Vite's static middleware handles it before React Router SSR can intercept it.
      manifest: false,
      // Service worker only runs in production builds.
      // In dev the SW file doesn't exist, so we skip registration (see entry.client.tsx).
      devOptions: { enabled: false },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
      },
    }),
  ],
  resolve: {
    // Native Vite tsconfig paths resolution (no plugin needed in Vite 8)
    tsconfigPaths: true,
  },
});
