import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export { withSupabase } from "@supabase/server";

/**
 * Creates a server-side Supabase client for Server Components, Server Actions,
 * and Route Handlers using Next.js cookie store.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://dummy.supabase.co";
  const supabaseKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "dummy-anon-key";

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignored if called from a pure Server Component
        }
      },
    },
  });
}
