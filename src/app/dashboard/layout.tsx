import { ReactNode } from 'react'
import { logout } from '../(auth)/actions'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-xl border-b border-border-custom">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-black text-indigo-500 tracking-tight">TaskFlow</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-400 font-medium">
                {user?.email}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-sm text-zinc-400 hover:text-white transition-colors font-bold"
                >
                  Çıkış Yap
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
