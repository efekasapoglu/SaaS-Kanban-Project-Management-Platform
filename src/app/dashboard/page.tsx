import { createClient } from '@/lib/supabase/server'
import { CreateBoardModal } from '@/components/modals/CreateBoardModal'
import Link from 'next/link'
import { Calendar, Users } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Kullanıcının sahip olduğu veya public olan tüm panoları çekelim (veya sadece kullanıcınınkiler)
  // Şimdilik sadece kullanıcının kendi panolarını gösterelim
  const { data: boards } = await supabase
    .from('boards')
    .select('*')
    .eq('owner_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Panolarım</h2>
          <p className="mt-1 text-sm text-zinc-400 font-medium">
            Projelerinizi yönetmek için bir pano seçin veya yeni oluşturun.
          </p>
        </div>
        <CreateBoardModal />
      </div>

      {boards && boards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => (
            <Link key={board.id} href={`/b/${board.id}`}>
              <div className="group relative overflow-hidden border border-border-custom rounded-2xl p-6 bg-card/60 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-2xl hover:border-indigo-500/50 hover:bg-card transition-all duration-300 cursor-pointer">
                {/* Vibrant Accent Glow */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
                
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors tracking-tight">
                  {board.title}
                </h3>
                <div className="mt-4 flex items-center gap-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(board.created_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                  {board.is_public && (
                    <div className="flex items-center gap-1 text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-900/30">
                      <Users className="w-3 h-3" />
                      Public
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Henüz pano yok</h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Yeni bir pano oluşturarak hemen başlayın.
          </p>
          <div className="mt-6">
            <CreateBoardModal />
          </div>
        </div>
      )}
    </div>
  )
}
