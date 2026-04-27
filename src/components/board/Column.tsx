'use client'

import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Column as ColumnType, Task as TaskType } from '@/types'
import { TaskCard } from '@/components/board/TaskCard'
import { useMemo, useState } from 'react'
import { calculateNewOrder } from '@/lib/dnd-utils'
import { createTask } from '@/app/b/[boardId]/actions'

interface Props {
  column: ColumnType
  tasks: TaskType[]
  isReadOnly: boolean
  isOverlay?: boolean
  onTaskClick?: (task: TaskType) => void
  onTaskAdd?: (task: TaskType) => void
}

export function Column({ column, tasks, isReadOnly, isOverlay, onTaskClick, onTaskAdd }: Props) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
    disabled: isReadOnly,
  })

  const tasksIds = useMemo(() => tasks.map((t) => t.id), [tasks])
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  }

  async function handleAddTask() {
    if (!newTaskTitle.trim()) {
      setIsAddingTask(false)
      return
    }
    
    const lastTaskOrder = tasks.length > 0 ? tasks[tasks.length - 1].order : null
    const newOrder = calculateNewOrder(lastTaskOrder, null)
    
    // İyimser olarak ekliyoruz veya DB'den döneni state'e atıyoruz
    const newTask = await createTask(column.id, column.board_id, newTaskTitle, newOrder)
    if (newTask && onTaskAdd) {
      onTaskAdd(newTask)
    }
    
    setNewTaskTitle('')
    setIsAddingTask(false)
  }

  // Sürüklenirken yer tutucu (placeholder) tasarımı
  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="w-80 shrink-0 flex flex-col h-[500px] border-2 border-dashed border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl opacity-50"
      />
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-80 shrink-0 flex flex-col max-h-full bg-card/40 backdrop-blur-xl rounded-2xl border border-border-custom shadow-[0_8px_30px_rgb(0,0,0,0.3)] ${isOverlay ? 'rotate-2 scale-105 shadow-2xl cursor-grabbing ring-2 ring-indigo-500' : ''}`}
    >
      {/* Color Strip Accent */}
      <div className="h-1.5 w-full rounded-t-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80" />
      
      {/* Sütun Başlığı */}
      <div
        {...attributes}
        {...listeners}
        className={`h-14 flex items-center justify-between px-4 bg-transparent border-b border-border-custom ${
          isReadOnly ? '' : 'cursor-grab active:cursor-grabbing'
        }`}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-zinc-100 text-[15px] tracking-tight">{column.title}</h3>
          <span className="text-[10px] font-black text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded-full shadow-sm border border-indigo-900/50">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Sütun Gövdesi (Görevlerin listelendiği yer) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar flex flex-col min-h-0 bg-black/10">
        <SortableContext items={tasksIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} isReadOnly={isReadOnly} onClick={() => onTaskClick?.(task)} />
          ))}
        </SortableContext>

        {/* Görev Ekleme Alanı */}
        {!isReadOnly && (
          <div className="mt-2">
            {isAddingTask ? (
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 shadow-lg border border-indigo-100 dark:border-indigo-900 animate-in fade-in zoom-in duration-200">
                <textarea
                  autoFocus
                  placeholder="Görev başlığı..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleAddTask()
                    }
                    if (e.key === 'Escape') setIsAddingTask(false)
                  }}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 resize-none mb-3"
                  rows={2}
                />
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleAddTask}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md active:scale-95"
                  >
                    Ekle
                  </button>
                  <button 
                    onClick={() => setIsAddingTask(false)}
                    className="px-3 py-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-xs font-bold"
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsAddingTask(true)}
                className="w-full group/add flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
              >
                <div className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover/add:bg-indigo-500 group-hover/add:text-white transition-colors">
                  <span className="text-sm font-bold">+</span>
                </div>
                <span className="text-xs font-bold">Yeni Görev</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
