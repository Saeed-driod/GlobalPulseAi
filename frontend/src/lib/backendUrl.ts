/**
 * Server-only utility to resolve the backend base URL.
 * Reads the server-only BACKEND_URL environment variable without exposing it
 * to client-side bundles.
 */
export function getBackendBaseUrl(): string {
  const envUrl = process.env.BACKEND_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return "http://150.136.214.192";
}
