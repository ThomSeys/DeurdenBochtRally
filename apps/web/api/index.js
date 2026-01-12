export default async function handler(req, res) {
  try {
    const reactRouterNode = await import("@react-router/node");
    const build = await import("../build/server/index.js");
    
    // Handle both default export and named export
    const createRequestHandler = reactRouterNode.createRequestHandler || reactRouterNode.default?.createRequestHandler || reactRouterNode.default;
    
    if (typeof createRequestHandler !== 'function') {
      console.error("Available exports:", Object.keys(reactRouterNode));
      throw new Error(`createRequestHandler is not a function, got: ${typeof createRequestHandler}`);
    }
    
    const requestHandler = createRequestHandler({ build });
    return requestHandler(req, res);
  } catch (error) {
    console.error("Error loading React Router build:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
}