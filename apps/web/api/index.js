import { createRequestListener } from "@react-router/node";
import * as build from "../build/server/index.js";

const listener = createRequestListener({ build });

export default async function handler(req, res) {
  return listener(req, res);
}