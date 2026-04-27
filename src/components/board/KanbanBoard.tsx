'use client'

import { useState, useMemo, useSyncExternalStore } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  TouchSensor
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy
} from '@dnd-kit/sortable'
import { Column as ColumnType, Task as TaskType } from '@/types'
import { Column } from '@/components/board/Column'
import { TaskCard } from '@/components/board/TaskCard'
import { calculateNewOrder } from '@/lib/dnd-utils'
import { updateTaskOrder, updateColumnOrder, createColumn } from '@/app/b/[boardId]/actions'
import { TaskDetailModal } from '@/components/modals/TaskDetailModal'

interface Props {
  boardId: string
  initialColumns: ColumnType[]
  initialTasks: TaskType[]
  isReadOnly: boolean
}

// Öncelik ağırlığı: Yüksek = 3, Orta = 2, Düşük = 1
const getPriorityWeight = (priority: string | undefined | null) => {
  if (priority === 'High') return 3;
  if (priority === 'Medium') return 2;
  if (priority === 'Low') return 1;
  return 0;
};

// Görevleri Öncelik > Order mantığına göre sıralayan fonksiyon
const sortTasks = (a: TaskType, b: TaskType) => {
  const weightA = getPriorityWeight(a.priority);
  const weightB = getPriorityWeight(b.priority);
  if (weightA !== weightB) {
    return weightB - weightA; // Yüksek öncelik her zaman üstte
  }
  return a.order - b.order; // Aynı öncelikteyse order'a göre sırala
};

export function KanbanBoard({ boardId, initialColumns, initialTasks, isReadOnly }: Props) {
  const [columns, setColumns] = useState<ColumnType[]>(initialColumns)
  const [tasks, setTasks] = useState<TaskType[]>(() => [...initialTasks].sort(sortTasks))
  
  const [activeColumn, setActiveColumn] = useState<ColumnType | null>(null)
  const [activeTask, setActiveTask] = useState<TaskType | null>(null)
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null)
  
  const [isAddingCol, setIsAddingCol] = useState(false)
  const [newColTitle, setNewColTitle] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  // Recommended way to sync state from props to avoid effect cascading
  const [prevInitialColumns, setPrevInitialColumns] = useState(initialColumns)
  const [prevInitialTasks, setPrevInitialTasks] = useState(initialTasks)

  if (initialColumns !== prevInitialColumns) {
    setColumns(initialColumns)
    setPrevInitialColumns(initialColumns)
  }

  if (initialTasks !== prevInitialTasks) {
    setTasks([...initialTasks].sort(sortTasks))
    setPrevInitialTasks(initialTasks)
  }

  // Sütunları ID'ye göre kolayca bulabilmek için
  const columnsId = useMemo(() => columns.map((col) => col.id), [columns])

  // Arama filtresi
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks
    const query = searchQuery.toLowerCase()
    return tasks.filter(t => 
      t.title.toLowerCase().includes(query) || 
      (t.description && t.description.toLowerCase().includes(query)) ||
      (t.labels && t.labels.some(l => l.name.toLowerCase().includes(query)))
    )
  }, [tasks, searchQuery])

  // DND Sensörleri (Mobil uyumluluk için TouchSensor eklendi)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Daha kararlı bir başlangıç için 5px tolerans
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Mobilde kaydırma (scroll) yaparken karışmaması için gecikme
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  if (!isMounted) return null // Dnd-kit SSR Hydration hatasını engellemek için, hooklardan SONRA olmalı.

  function onDragStart(event: DragStartEvent) {
    if (isReadOnly || searchQuery.trim()) return // Arama varken dnd'yi geçici olarak devre dışı bırakmak iyi bir pratiktir
    const { active } = event
    if (active.data.current?.type === 'Column') {
      setActiveColumn(active.data.current.column)
      return
    }
    if (active.data.current?.type === 'Task') {
      setActiveTask(active.data.current.task)
      return
    }
  }

  function onDragOver(event: DragOverEvent) {
    if (isReadOnly || searchQuery.trim()) return
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const isActiveTask = active.data.current?.type === 'Task'
    const isOverTask = over.data.current?.type === 'Task'
    const isOverColumn = over.data.current?.type === 'Column'

    if (!isActiveTask) return

    // Senaryo 1: Kartı başka bir kartın üzerine sürüklemek
    if (isActiveTask && isOverTask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId.toString())
        const overIndex = tasks.findIndex((t) => t.id === overId.toString())

        if (tasks[activeIndex].column_id !== tasks[overIndex].column_id) {
          const updatedTasks = [...tasks]
          updatedTasks[activeIndex] = {
            ...updatedTasks[activeIndex],
            column_id: tasks[overIndex].column_id
          }
          return arrayMove(updatedTasks, activeIndex, overIndex)
        }

        // Aynı sütunda Trello gibi anında görsel geri bildirim için arrayMove kullanıyoruz.
        return arrayMove(tasks, activeIndex, overIndex)
      })
    }

    // Senaryo 2: Kartı boş bir sütunun içine bırakmak
    if (isActiveTask && isOverColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId.toString())
        if (tasks[activeIndex].column_id === overId.toString()) return tasks
        
        const updatedTasks = [...tasks]
        updatedTasks[activeIndex] = {
          ...updatedTasks[activeIndex],
          column_id: overId.toString()
        }
        return arrayMove(updatedTasks, activeIndex, activeIndex)
      })
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveColumn(null)
    setActiveTask(null)

    if (isReadOnly || searchQuery.trim()) return
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    // SÜTUN SÜRÜKLEME MANTIĞI
    const isActiveColumn = active.data.current?.type === 'Column'
    if (isActiveColumn) {
      setColumns((columns) => {
        const activeIndex = columns.findIndex((col) => col.id === activeId.toString())
        const overIndex = columns.findIndex((col) => col.id === overId.toString())
        
        const newCols = arrayMove(columns, activeIndex, overIndex)
        
        // Spaced Integer Hesaplaması
        const prevOrder = overIndex > 0 ? newCols[overIndex - 1].order : null
        const nextOrder = overIndex < newCols.length - 1 ? newCols[overIndex + 1].order : null
        const newOrder = calculateNewOrder(prevOrder, nextOrder)
        
        newCols[overIndex] = {
          ...newCols[overIndex],
          order: newOrder
        }
        
        // Arka planda DB'yi güncelle
        updateColumnOrder(boardId, activeId.toString(), newOrder)
        
        return newCols
      })
      return
    }

    // GÖREV SÜRÜKLEME MANTIĞI
    const isActiveTask = active.data.current?.type === 'Task'
    if (isActiveTask) {
      setTasks((currentTasks) => {
        const activeIndex = currentTasks.findIndex((t) => t.id === activeId.toString())
        const activeTask = currentTasks[activeIndex]
        
        // currentTasks zaten onDragOver içindeki arrayMove sayesinde doğru fiziksel sırada.
        // Komşuları bulmak için o anki fiziksel sırayı baz alıyoruz (Öncelik filtresi sonradan uygulanacak).
        const columnTasks = currentTasks.filter(t => t.column_id === activeTask.column_id)
        
        const taskInColIndex = columnTasks.findIndex(t => t.id === activeId.toString())

        // Spaced Integer Hesaplaması
        const prevOrder = taskInColIndex > 0 ? columnTasks[taskInColIndex - 1].order : null
        const nextOrder = taskInColIndex < columnTasks.length - 1 ? columnTasks[taskInColIndex + 1].order : null
        const newOrder = calculateNewOrder(prevOrder, nextOrder)

        const newTasks = [...currentTasks]
        newTasks[activeIndex] = {
          ...newTasks[activeIndex],
          order: newOrder
        }

        // Arka planda DB'yi güncelle
        updateTaskOrder(boardId, activeId.toString(), activeTask.column_id, newOrder)

        // İşlem bittikten sonra "Öncelik > Order" kuralını zorla uygula.
        // Eğer kullanıcı orta öncelikli bir kartı yükseklerin arasına sürüklediyse, 
        // bu sort işlemi onu anında ait olduğu yere (ortaların en üstüne) geri çekecek!
        return newTasks.sort(sortTasks)
      })
    }
  }

  async function handleAddColumn() {
    if (!newColTitle.trim()) {
      setIsAddingCol(false)
      return
    }
    
    // Spaced Integer for new column at the end
    const lastColOrder = columns.length > 0 ? columns[columns.length - 1].order : null
    const newOrder = calculateNewOrder(lastColOrder, null)
    
    // İyimser UI (Optimistic UI) güncellenmesi burada da yapılabilir ancak basitlik için DB'den döneni bekliyoruz
    const newCol = await createColumn(boardId, newColTitle, newOrder)
    if (newCol) {
      setColumns([...columns, newCol])
    }
    setNewColTitle('')
    setIsAddingCol(false)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Arama Çubuğu */}
      <div className="mb-6 flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="Kartlarda ara (başlık, açıklama, etiket)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors shadow-sm"
          />
          <svg className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex-1 overflow-x-auto custom-scrollbar pb-4">
          <div className="flex items-start gap-6 h-full min-h-0">
            <SortableContext items={columnsId} strategy={horizontalListSortingStrategy}>
              {columns.map((col) => (
                <Column
                  key={col.id}
                  column={col}
                  tasks={filteredTasks.filter((t) => t.column_id === col.id)}
                  isReadOnly={isReadOnly}
                  onTaskClick={(task: TaskType) => setSelectedTask(task)}
                  onTaskAdd={(newTask: TaskType) => setTasks((prev) => [...prev, newTask])}
                />
              ))}
            </SortableContext>

        
        {!isReadOnly && (
          <div className="w-80 shrink-0">
            {isAddingCol ? (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl p-3 shadow-sm">
                <input
                  autoFocus
                  type="text"
                  placeholder="Sütun adı..."
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddColumn()
                    if (e.key === 'Escape') {
                      setIsAddingCol(false)
                      setNewColTitle('')
                    }
                  }}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center gap-2 mt-3">
                  <button 
                    onClick={handleAddColumn}
                    className="bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Ekle
                  </button>
                  <button 
                    onClick={() => { setIsAddingCol(false); setNewColTitle(''); }}
                    className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-xs font-medium px-3 py-1.5 transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsAddingCol(true)}
                className="w-full flex items-center gap-2 px-4 py-3 bg-white/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-xl transition-colors font-medium text-sm"
              >
                <span className="text-lg">+</span> Yeni Sütun Ekle
              </button>
            )}
          </div>
        )}
          </div>
        </div>

      <DragOverlay>
        {activeColumn && (
          <Column column={activeColumn} tasks={tasks.filter((t) => t.column_id === activeColumn.id)} isReadOnly={isReadOnly} isOverlay />
        )}
        {activeTask && <TaskCard task={activeTask} isReadOnly={isReadOnly} isOverlay onClick={() => {}} />}
      </DragOverlay>

      {/* Görev Detay Modalı */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          columns={columns}
          boardId={boardId}
          isReadOnly={isReadOnly}
          tasksInBoard={tasks}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={(updatedTask) => {
            setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t))
          }}
        />
      )}
    </DndContext>
    </div>
  )
}
