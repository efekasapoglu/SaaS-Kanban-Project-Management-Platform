'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { TaskUpdate, Activity } from '@/types'

// Sütun sırasını günceller
export async function updateColumnOrder(boardId: string, columnId: string, newOrder: number) {
  const supabase = await createClient()
  const { error } = await supabase.from('columns').update({ order: newOrder }).eq('id', columnId)
  
  if (error) {
    console.error('Update column order error:', error)
  } else {
    revalidatePath(`/b/${boardId}`)
  }
}

// Görev sırasını ve sütununu günceller (Sürükle-bırak ile)
export async function updateTaskOrder(boardId: string, taskId: string, newColumnId: string, newOrder: number) {
  const supabase = await createClient()
  
  // Önce eski görev verisini al (hangi sütundan geldiğini loglamak için)
  const { data: oldTask } = await supabase.from('tasks').select('column_id').eq('id', taskId).single()
  
  const { error } = await supabase.from('tasks').update({ 
    column_id: newColumnId, 
    order: newOrder 
  }).eq('id', taskId)

  if (error) {
    console.error('Update task order error:', error)
  } else {
    revalidatePath(`/b/${boardId}`)
  }

  // Eğer sütun değiştiyse aktivite kaydı oluştur
  if (oldTask && oldTask.column_id !== newColumnId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('activities').insert([{
        task_id: taskId,
        user_id: user.id,
        action_type: 'MOVED',
        details: { from_column: oldTask.column_id, to_column: newColumnId }
      }])
    }
  }
}

// Yeni sütun oluşturur
export async function createColumn(boardId: string, title: string, order: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('columns')
    .insert([{ board_id: boardId, title, order }])
    .select()
    .single()
  
  if (error) {
    console.error('Column creation error:', error)
  } else {
    revalidatePath(`/b/${boardId}`)
  }
  return data
}

// Yeni görev oluşturur
export async function createTask(columnId: string, boardId: string, title: string, order: number) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tasks')
    .insert([{ column_id: columnId, title, order }])
    .select()
    .single()

  if (data) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('activities').insert([{
        task_id: data.id,
        user_id: user.id,
        action_type: 'CREATED',
        details: {}
      }])
    }
    revalidatePath(`/b/${boardId}`)
  }
  return data
}

// Görev detaylarını günceller
export async function updateTask(taskId: string, boardId: string, updates: TaskUpdate) {
  const supabase = await createClient()
  
  // Eğer sütun değiştiriliyorsa logla
  if (updates.column_id) {
    const { data: oldTask } = await supabase.from('tasks').select('column_id').eq('id', taskId).single()
    if (oldTask && oldTask.column_id !== updates.column_id) {
       const { data: { user } } = await supabase.auth.getUser()
       if (user) {
         await supabase.from('activities').insert([{
           task_id: taskId,
           user_id: user.id,
           action_type: 'MOVED',
           details: { from_column: oldTask.column_id, to_column: updates.column_id }
         }])
       }
    }
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single()

  if (error) {
    console.error('Task update error:', error)
  } else {
    revalidatePath(`/b/${boardId}`)
  }
  return data
}

// Belirli bir görevin aktivitelerini çeker
export async function getActivities(taskId: string): Promise<Activity[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('activities')
    .select('*, profiles(full_name, email)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })
  return data || []
}

// Panonun public durumunu günceller
export async function toggleBoardPublic(boardId: string, isPublic: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('boards')
    .update({ is_public: isPublic })
    .eq('id', boardId)
  
  if (!error) {
    revalidatePath(`/b/${boardId}`)
  }
}
// Kullanıcıyı panoya üye olarak ekler (Link üzerinden giriş)
export async function joinBoard(boardId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return
  
  // Önce üye mi diye kontrol et (Zaten üyeyse hata vermemesi için)
  const { data: existing } = await supabase
    .from('board_members')
    .select('id')
    .eq('board_id', boardId)
    .eq('user_id', user.id)
    .single()
    
  if (existing) return

  // Üye değilse ekle
  await supabase
    .from('board_members')
    .insert([{ board_id: boardId, user_id: user.id, role: 'editor' }])
    
  revalidatePath(`/b/${boardId}`)
}
