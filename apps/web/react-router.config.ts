import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  buildEnd: async ({ buildManifest }) => {
    await import("@react-router/architect").then((mod) =>
      mod.unstable_vercel({ buildManifest })
    );
  },
} satisfies Config;