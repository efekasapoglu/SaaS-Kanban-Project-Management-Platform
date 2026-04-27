'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Kullanıcı girişi için sunucu işlemi (Server Action)
export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Giriş başarısız olursa login sayfasına hata mesajıyla yönlendir
    redirect('/login?error=Invalid login credentials')
  }

  // Başarılı girişte panoya (dashboard) yönlendir
  revalidatePath('/dashboard')
  redirect('/dashboard')
}

// Kullanıcı kaydı için sunucu işlemi (Server Action)
export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    redirect('/register?error=' + error.message)
  }

  // Başarılı kayıtta e-posta doğrulaması için login sayfasına yönlendir
  redirect('/login?message=Email doğrulaması için gelen kutunuzu kontrol edin.')
}

// Kullanıcı çıkışı
export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
