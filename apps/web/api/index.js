import { createRequestHandler } from "@react-router/node";

export default async function handler(req, res) {
  try {
    // Dynamically import the server build
    const build = await import("../build/server/index.js");
    const requestHandler = createRequestHandler({ build });
    return requestHandler(req, res);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
}
