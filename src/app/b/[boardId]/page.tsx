import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Task } from '@/types'
import { KanbanBoard } from '@/components/board/KanbanBoard'
import { ShareBoardButton } from '@/components/board/ShareBoardButton'

// Pano detayları için sayfa bileşeni
export default async function BoardPage(props: { params: Promise<{ boardId: string }> }) {
  const params = await props.params;
  const boardId = params.boardId
  const supabase = await createClient()

  // Panoyu ve o panoya ait yetkiyi kontrol et (RLS sayesinde otomatik kısıtlanır)
  const { data: board, error: boardError } = await supabase
    .from('boards')
    .select('*')
    .eq('id', boardId)
    .single()

  if (boardError || !board) {
    notFound()
  }

  // Şu anki kullanıcı
  const { data: { user } } = await supabase.auth.getUser()
  
  // Üyelik kontrolü
  const { data: member } = user ? await supabase
    .from('board_members')
    .select('role')
    .eq('board_id', boardId)
    .eq('user_id', user.id)
    .single() : { data: null }

  const isOwner = board.owner_id === user?.id
  const isMember = !!member
  
  // Eğer kullanıcı üye değilse, sahip değilse ama pano PUBLIC ise otomatik "KATIL" (Editor olarak)
  // Bu, "paylaşılan linkten giren herkes" mantığını sağlar.
  if (user && !isOwner && !isMember && board.is_public) {
    const { joinBoard } = await import('./actions')
    await joinBoard(boardId)
    // joinBoard revalidatePath tetiklediği için sayfa yenilenecek ve üye olarak dönecek.
  }

  // Not: Eğer public ve login olmuşsa editor yapıyoruz. Login olmamışsa mecburen read-only.
  const finalReadOnly = user ? (isOwner || isMember ? false : !board.is_public) : true

  // Sütunları Çek (Sıralamaya göre artan sırada)
  const { data: columnsData } = await supabase
    .from('columns')
    .select('*')
    .eq('board_id', boardId)
    .order('order', { ascending: true })
    
  // Görevleri Çek
  const columnIds = columnsData?.map(col => col.id) || []
  
  let tasksData: Task[] = []
  if (columnIds.length > 0) {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .in('column_id', columnIds)
      .order('order', { ascending: true })
    if (data) tasksData = data as Task[]
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0c]">
      {/* Üst Kısım (Header) */}
      <header className="h-14 border-b border-border-custom bg-card/60 backdrop-blur-xl px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-black text-white tracking-tight">{board.title}</h1>
          {finalReadOnly && (
            <span className="bg-zinc-900 text-zinc-400 text-[10px] font-black uppercase px-2 py-1 rounded border border-zinc-800 tracking-wider">
              Salt Okunur
            </span>
          )}
          {!finalReadOnly && !isOwner && (
            <span className="bg-emerald-900/30 text-emerald-400 text-[10px] font-black uppercase px-2 py-1 rounded border border-emerald-900/50 tracking-wider">
              Editör Modu
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ShareBoardButton boardId={boardId} isPublic={board.is_public} isOwner={isOwner} />
        </div>
      </header>

      {/* Kanban Canvas Alanı */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scrollbar">
        <KanbanBoard 
          boardId={boardId}
          initialColumns={columnsData || []} 
          initialTasks={tasksData || []} 
          isReadOnly={finalReadOnly}
        />
      </main>
    </div>
  )
}
