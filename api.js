import { supabase } from "./supabase.js";

// Same as fetch(), but adds "Authorization: Bearer <login token>" so the backend
// knows which user is asking.
export async function apiFetch(url, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (res.status === 401) await supabase.auth.signOut(); // token no longer valid
  return res;
}

// Turns a response into JSON, or throws if the server said something went wrong.
export async function readJson(res) {
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}
