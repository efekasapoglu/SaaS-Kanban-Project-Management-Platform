import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Sunucu tarafında Supabase bağlantısı oluşturur
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // "Sunucu bileşeni" içerisinden çağrıldığında setAll fırlatabilir.
            // Eğer varsa bu hatayı yoksayabiliriz çünkü middleware zaten yakalayacaktır.
          }
        },
      },
    }
  )
}
