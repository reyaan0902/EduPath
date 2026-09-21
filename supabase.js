import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// null when frontend/.env is missing, so the app can show a friendly message
export const supabase = url && key ? createClient(url, key) : null;
