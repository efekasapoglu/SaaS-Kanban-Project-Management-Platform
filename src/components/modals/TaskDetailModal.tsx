'use client'

import { useState, useEffect } from 'react'
import { Task, Column, Activity } from '@/types'
import { updateTask, getActivities } from '@/app/b/[boardId]/actions'
import ReactMarkdown from 'react-markdown'
import { calculateNewOrder } from '@/lib/dnd-utils'

interface Props {
  task: Task
  columns: Column[]
  boardId: string
  isReadOnly: boolean
  onClose: () => void
  onUpdateTask: (task: Task) => void
  tasksInBoard: Task[] // For calculating new order when changing columns via dropdown
}

export function TaskDetailModal({ task, columns, boardId, isReadOnly, onClose, onUpdateTask, tasksInBoard }: Props) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.substring(0, 16) : '') // YYYY-MM-DDThh:mm
  const [priority, setPriority] = useState(task.priority || 'Medium')
  const [columnId, setColumnId] = useState(task.column_id)

  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [activities, setActivities] = useState<Activity[]>([])

  // ESC ile kapatma
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Aktiviteleri çek
  useEffect(() => {
    async function fetchActivities() {
      const data = await getActivities(task.id)
      setActivities(data)
    }
    fetchActivities()
  }, [task.id])

  const handleSave = async () => {
    if (isReadOnly) return
    setIsSaving(true)

    let finalOrder = task.order

    // Eğer dropdown üzerinden sütun değiştirildiyse, yeni sütunun sonuna ekle (Erişilebilirlik - Fallback)
    if (columnId !== task.column_id) {
      const colTasks = tasksInBoard.filter(t => t.column_id === columnId)
      const lastOrder = colTasks.length > 0 ? colTasks[colTasks.length - 1].order : null
      finalOrder = calculateNewOrder(lastOrder, null)
    }

    const updates = {
      title,
      description,
      due_date: dueDate ? new Date(dueDate).toISOString() : null, // UTC olarak kaydet
      priority,
      column_id: columnId,
      order: finalOrder,
    }

    await updateTask(task.id, boardId, updates)
    
    onUpdateTask({ ...task, ...updates } as Task)
    setIsSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Başlık Alanı */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isReadOnly}
            className="w-full text-2xl font-bold bg-transparent text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-b-2 focus:border-indigo-500 disabled:opacity-100"
          />
          <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Şu anki sütun:{' '}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {columns.find(c => c.id === task.column_id)?.title}
            </span>
          </div>
        </div>

        {/* Gövde Alanı */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col md:flex-row gap-8">
          
          {/* Sol: Açıklama ve Aktiviteler */}
          <div className="flex-1 space-y-8">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Açıklama (Markdown destekli)</h4>
                {!isReadOnly && (
                  <button 
                    onClick={async () => {
                      if (!description) return
                      setIsSaving(true)
                      // Simulate AI Processing
                      await new Promise(res => setTimeout(res, 1500))
                      const enhanced = `### Görev Özeti\n${description}\n\n### Yapılacaklar\n- [ ] Alt görev 1\n- [ ] Alt görev 2\n\n### Teknik Notlar\n- Detaylı analiz yapılacak.`
                      setDescription(enhanced)
                      setIsEditingDesc(true)
                      setIsSaving(false)
                    }}
                    disabled={isSaving || !description}
                    className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI Enhance
                  </button>
                )}
              </div>
              {isEditingDesc && !isReadOnly ? (
                <div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full h-40 resize-y bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 custom-scrollbar"
                    placeholder="Görev detaylarını buraya yazın..."
                  />
                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={() => setIsEditingDesc(false)}
                      className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 text-xs font-medium rounded-md transition-colors"
                    >
                      Önizleme
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className={`prose prose-indigo dark:prose-invert max-w-none min-h-[150px] p-4 rounded-xl border bg-zinc-950/30 shadow-inner ${isReadOnly ? 'border-transparent' : 'border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors'}`}
                  onClick={() => !isReadOnly && setIsEditingDesc(true)}
                >
                  {description ? (
                    <ReactMarkdown>{description}</ReactMarkdown>
                  ) : (
                    <span className="text-zinc-500 italic">Görev detaylarını Markdown formatında (liste, başlık vb.) eklemek için tıklayın...</span>
                  )}
                </div>
              )}
            </div>
            
            {/* Aktivite Geçmişi (Activity History) */}
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">Aktivite Geçmişi</h4>
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Henüz bir aktivite yok.</p>
                ) : (
                  activities.map(act => (
                    <div key={act.id} className="flex gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center shrink-0 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                        {act.profiles?.full_name ? act.profiles.full_name.charAt(0).toUpperCase() : act.profiles?.email?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-zinc-900 dark:text-zinc-100">
                          <span className="font-semibold">{act.profiles?.full_name || act.profiles?.email}</span>
                          {' '}
                          {act.action_type === 'CREATED' && 'bu görevi oluşturdu.'}
                          {act.action_type === 'MOVED' && (
                            <span>
                              bu görevi <strong>{columns.find(c => c.id === act.details.from_column)?.title}</strong> sütunundan <strong>{columns.find(c => c.id === act.details.to_column)?.title}</strong> sütununa taşıdı.
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(act.created_at))}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sağ: Özellikler (Sidebar) */}
          <div className="w-full md:w-64 shrink-0 space-y-6">
            
            {/* Sütun Değiştirme (Fallback Dropdown) */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Sütun (Taşı)</label>
              <select
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                disabled={isReadOnly}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
              >
                {columns.map(col => (
                  <option key={col.id} value={col.id}>{col.title}</option>
                ))}
              </select>
            </div>

            {/* Öncelik */}
            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Öncelik Seviyesi</label>
              <div className="grid grid-cols-3 gap-2">
                {(['High', 'Medium', 'Low'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => !isReadOnly && setPriority(p)}
                    disabled={isReadOnly}
                    className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all border ${
                      priority === p 
                        ? p === 'High' ? 'bg-rose-500 border-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]' 
                        : p === 'Medium' ? 'bg-amber-500 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        : 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    {p === 'High' ? 'Yüksek' : p === 'Medium' ? 'Orta' : 'Düşük'}
                  </button>
                ))}
              </div>
            </div>

            {/* Bitiş Tarihi */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Bitiş Tarihi</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isReadOnly}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            
          </div>
        </div>

        {/* Alt Kısım (Footer) */}
        {!isReadOnly && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0 flex justify-end gap-3 bg-zinc-50 dark:bg-zinc-900/50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center gap-2"
            >
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
