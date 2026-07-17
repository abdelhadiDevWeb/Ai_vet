// Base URL of the backend. The app appends `/api/...` to it, so we strip a
// trailing slash and an accidental `/api` suffix from the configured value —
// both are common misconfigurations in hosting dashboards.
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000")
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");
