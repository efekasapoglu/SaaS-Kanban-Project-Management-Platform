'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task } from '@/types'

interface Props {
  task: Task
  isReadOnly: boolean
  isOverlay?: boolean
  onClick?: () => void
}

export function TaskCard({ task, isReadOnly, isOverlay, onClick }: Props) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
    disabled: isReadOnly,
  })

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  }

  const [isCompleted, setIsCompleted] = useState(false)

  // Sürüklenirken bırakılacak alanın gri yer tutucusu (placeholder)
  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-[100px] bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 opacity-60"
      />
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`group relative bg-zinc-900 p-3 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.4)] border border-zinc-800 hover:shadow-lg transition-all duration-200
        ${isReadOnly ? '' : 'cursor-grab active:cursor-grabbing hover:border-indigo-500'}
        ${isOverlay ? 'rotate-3 scale-105 shadow-2xl cursor-grabbing ring-2 ring-indigo-500' : ''}
        ${isCompleted ? 'bg-emerald-950/20 border-emerald-900/50' : ''}
      `}
    >
      {/* Sol Hover Circle (Checkmark) */}
      {!isReadOnly && (
        <div 
          onClick={(e) => {
            e.stopPropagation()
            setIsCompleted(!isCompleted)
          }}
          className={`absolute left-0 top-1/2 -translate-y-1/2 -ml-3 flex items-center justify-center w-6 h-6 rounded-full border shadow-sm cursor-pointer z-10 transition-all duration-200
            ${isCompleted ? 'border-emerald-500 bg-emerald-500 text-white opacity-100' : 'border-zinc-700 bg-zinc-900 text-transparent hover:border-emerald-500 opacity-0 group-hover:opacity-100'}
          `}
        >
          <svg className={`w-3.5 h-3.5 ${isCompleted ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Sağ 3 Nokta (Options Menu Placeholder) */}
      {!isReadOnly && (
        <div 
          onClick={(e) => {
            e.stopPropagation()
            if (onClick) onClick()
          }}
          className="absolute right-2 top-2 p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </div>
      )}

      <div>
        {/* Etiketler ve Öncelik */}
        <div className="flex items-center gap-1.5 mb-2 flex-wrap pr-6">
          {/* Öncelik Badge */}
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border shadow-sm ${
            task.priority === 'High' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
            task.priority === 'Medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
            'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          }`}>
            {task.priority === 'High' ? 'Yüksek' : task.priority === 'Medium' ? 'Orta' : 'Düşük'}
          </span>

          {task.labels && task.labels.length > 0 && task.labels.map((label, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>

        {/* Başlık */}
        <p className={`text-sm font-semibold break-words pr-6 ${isCompleted ? 'text-zinc-400' : 'text-zinc-100'}`}>
          {task.title}
        </p>
      </div>

      {/* Alt Bilgiler (Tarih, Atanan Kişi vb.) */}
      <div className={`mt-3 flex items-center justify-between text-[11px] ${isCompleted ? 'text-zinc-500' : 'text-zinc-400'}`}>
        {task.due_date ? (
          <span className={new Date(task.due_date) < new Date() && !isCompleted ? 'text-rose-400 font-bold bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-900/50' : 'px-2 py-0.5 bg-zinc-800 rounded-md font-medium border border-zinc-700/50'}>
            {new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' }).format(new Date(task.due_date))}
          </span>
        ) : (
          <span></span> // Yer tutucu
        )}
        
        {task.assignee_id && (
          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shadow-sm border border-white/10 ${isCompleted ? 'bg-zinc-800 text-zinc-500' : 'bg-gradient-to-tr from-indigo-500 to-purple-500 text-white'}`} title="Atanan Kişi">
            U
          </div>
        )}
      </div>
    </div>
  )
}
