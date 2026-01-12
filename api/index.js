import { createRequestHandler } from "@react-router/node";
import { installGlobals } from "@react-router/node";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

installGlobals();

export default async function handler(req, res) {
  try {
    // Import the server build from the correct location
    const buildPath = join(__dirname, "..", "apps", "web", "build", "server", "index.js");
    const build = await import(buildPath);
    
    const requestHandler = createRequestHandler({
      build,
      mode: process.env.NODE_ENV,
    });

    return await requestHandler(req, res);
  } catch (error) {
    console.error("Handler error:", error);
    console.error("Stack:", error.stack);
    return res.status(500).json({ 
      error: "Server error", 
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
}
