const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3005";

export const SERVICE_URLS = {
  auth: API_BASE,
  request: API_BASE,
  volunteer: API_BASE,
  notification: API_BASE
};
