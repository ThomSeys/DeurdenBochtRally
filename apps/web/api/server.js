import { createRequestHandler } from "@react-router/node";
import { installGlobals } from "@react-router/node";

installGlobals();

export default async function handler(req, res) {
  try {
    const build = await import("../build/server/index.js");
    const handle = createRequestHandler({
      build,
      mode: process.env.NODE_ENV,
    });

    return await handle(req, res);
  } catch (error) {
    console.error("Handler error:", error);
    return res.status(500).json({ 
      error: "Server error", 
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
}
