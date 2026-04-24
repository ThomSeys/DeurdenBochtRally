import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemaTypes";
import { structure } from "./structure";

export default defineConfig({
  name: "deur-den-bocht",
  title: "Deur Den Bocht",
  projectId: "1ttlodbl",
  dataset: "production",
  plugins: [
    structureTool({ structure }),
    visionTool(),
  ],
  schema: { types: schemaTypes },
});
