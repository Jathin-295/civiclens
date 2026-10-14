import { handleApiRequest } from '../server/apiHandler.js';

/**
 * Vercel Serverless Function entry point
 * Delegates incoming HTTP requests to CivicLens AI REST handler
 */
export default async function handler(req, res) {
  return handleApiRequest(req, res);
}
