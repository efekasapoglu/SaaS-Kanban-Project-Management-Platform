'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Yeni pano oluşturmak için sunucu işlemi (Server Action)
export async function createBoard(formData: FormData) {
  const supabase = await createClient()

  // Giriş yapmış kullanıcıyı al
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Yetkisiz işlem.')
  }

  const title = formData.get('title') as string
  const isPublic = formData.get('isPublic') === 'on'

  if (!title || title.trim() === '') {
    return { error: 'Pano adı boş olamaz.' }
  }

  // Veritabanına panoyu ekle
  const { data, error } = await supabase
    .from('boards')
    .insert([
      { title: title.trim(), owner_id: user.id, is_public: isPublic }
    ])
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Dashboard sayfasını yenile ve yeni panoya yönlendir
  revalidatePath('/dashboard')
  redirect(`/b/${data.id}`)
}
