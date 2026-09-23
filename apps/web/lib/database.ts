import "server-only";
import { createClient } from "@supabase/supabase-js";

export const setupMessage = "Service temporarily unavailable. Please try again later.";
export function database() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error(setupMessage);
  return createClient(url, key, { global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.any([...(init?.signal ? [init.signal] : []), AbortSignal.timeout(5000)]) }) }, auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
export function databaseConfigured() { return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SECRET_KEY; }
export function databaseError() { return setupMessage; }

