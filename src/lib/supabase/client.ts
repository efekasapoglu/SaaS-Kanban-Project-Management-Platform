import { createBrowserClient } from '@supabase/ssr'

// İstemci tarafında Supabase bağlantısı oluşturur
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
