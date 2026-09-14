import "server-only";
import { createClient } from "@supabase/supabase-js";

export const setupMessage = "Database setup required. Add SUPABASE_URL and SUPABASE_SECRET_KEY to apps/web/.env.local and apply supabase/migrations/001_backbone.sql.";
export function database() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error(setupMessage);
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
export function databaseConfigured() { return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SECRET_KEY; }
export function databaseError() { return databaseConfigured() ? "Database operation failed. Check Supabase and apply the schema migration." : setupMessage; }
