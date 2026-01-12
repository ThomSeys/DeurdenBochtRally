import { createRequestHandler } from "@react-router/node";

export default async function handler(req, res) {
  const build = await import("../build/server/index.js");
  const requestHandler = createRequestHandler({ build });
  return requestHandler(req, res);
}