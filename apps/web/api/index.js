export default async function handler(req, res) {
  try {
    const { createRequestHandler } = await import("@react-router/node");
    const build = await import("../build/server/index.js");
    const requestHandler = createRequestHandler({ build });
    return requestHandler(req, res);
  } catch (error) {
    console.error("Error loading React Router build:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
}