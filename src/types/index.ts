export type Board = {
  id: string
  title: string
  owner_id: string
  is_public: boolean
  created_at: string
}

export type Column = {
  id: string
  board_id: string
  title: string
  order: number
  created_at: string
}

export type Task = {
  id: string
  column_id: string
  title: string
  description: string | null
  assignee_id: string | null
  due_date: string | null
  priority: 'High' | 'Medium' | 'Low'
  labels: { color: string; name: string }[]
  order: number
  created_at: string
}

export type TaskUpdate = Partial<Omit<Task, 'id' | 'created_at'>>

export type Activity = {
  id: string
  task_id: string
  user_id: string
  action_type: 'CREATED' | 'MOVED' | 'UPDATED' | 'DELETED'
  details: {
    from_column?: string
    to_column?: string
    field?: string
    old_value?: unknown
    new_value?: unknown
  }
  created_at: string
  profiles?: {
    full_name: string | null
    email: string | null
  }
}
