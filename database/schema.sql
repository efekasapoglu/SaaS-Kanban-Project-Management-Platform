-- Supabase SQL Schema for TaskFlow (Full Unified Schema)

-- 1. Profiles: User profile information (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Boards: Kanban boards
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Board Members: Collaborative access
CREATE TABLE IF NOT EXISTS board_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('editor', 'viewer')) DEFAULT 'editor',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(board_id, user_id)
);

-- 4. Columns: Kanban columns
CREATE TABLE IF NOT EXISTS columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  "order" DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tasks: Individual tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID REFERENCES columns(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  priority TEXT CHECK (priority IN ('High', 'Medium', 'Low')) DEFAULT 'Medium',
  labels JSONB DEFAULT '[]'::JSONB,
  "order" DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Activities: Task activity log
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) Activation
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- RLS Helper Function to break circular dependencies (Infinite Recursion)
-- SECURITY DEFINER allows bypassing RLS for the internal check
CREATE OR REPLACE FUNCTION public.check_board_access(board_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM boards b
    WHERE b.id = board_uuid 
    AND (
      b.owner_id = user_uuid 
      OR b.is_public = true 
      OR EXISTS (SELECT 1 FROM board_members bm WHERE bm.board_id = b.id AND bm.user_id = user_uuid)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLICIES

-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Board Members
DROP POLICY IF EXISTS "Board members are viewable by board members and owner" ON board_members;
CREATE POLICY "Board members are viewable by board members and owner" ON board_members FOR SELECT USING (
  auth.uid() = user_id OR 
  (SELECT owner_id FROM boards WHERE id = board_id) = auth.uid()
);
DROP POLICY IF EXISTS "Users can join boards via link" ON board_members;
CREATE POLICY "Users can join boards via link" ON board_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Boards
DROP POLICY IF EXISTS "Boards are viewable by owner, members or if public" ON boards;
CREATE POLICY "Boards are viewable by owner, members or if public" ON boards FOR SELECT USING (
  check_board_access(id, auth.uid())
);
DROP POLICY IF EXISTS "Boards can be created by authenticated users" ON boards;
CREATE POLICY "Boards can be created by authenticated users" ON boards FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Boards can be updated by owner" ON boards;
CREATE POLICY "Boards can be updated by owner" ON boards FOR UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Boards can be deleted by owner" ON boards;
CREATE POLICY "Boards can be deleted by owner" ON boards FOR DELETE USING (auth.uid() = owner_id);

-- Columns
DROP POLICY IF EXISTS "Columns are viewable if board is viewable" ON columns;
CREATE POLICY "Columns are viewable if board is viewable" ON columns FOR SELECT USING (
  check_board_access(board_id, auth.uid())
);
DROP POLICY IF EXISTS "Columns can be modified by owner or editors" ON columns;
CREATE POLICY "Columns can be modified by owner or editors" ON columns FOR ALL USING (
  EXISTS (SELECT 1 FROM boards WHERE boards.id = columns.board_id AND (boards.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM board_members WHERE board_id = boards.id AND user_id = auth.uid() AND role = 'editor')))
);

-- Tasks
DROP POLICY IF EXISTS "Tasks are viewable if board is viewable" ON tasks;
CREATE POLICY "Tasks are viewable if board is viewable" ON tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM columns 
    WHERE columns.id = tasks.column_id AND check_board_access(columns.board_id, auth.uid())
  )
);
DROP POLICY IF EXISTS "Tasks can be modified by owner or editors" ON tasks;
CREATE POLICY "Tasks can be modified by owner or editors" ON tasks FOR ALL USING (
  EXISTS (
    SELECT 1 FROM columns 
    JOIN boards ON boards.id = columns.board_id 
    WHERE columns.id = tasks.column_id AND (boards.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM board_members WHERE board_id = boards.id AND user_id = auth.uid() AND role = 'editor'))
  )
);

-- Activities
DROP POLICY IF EXISTS "Activities are viewable if task is viewable" ON activities;
CREATE POLICY "Activities are viewable if task is viewable" ON activities FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tasks
    JOIN columns ON columns.id = tasks.column_id
    WHERE tasks.id = activities.task_id AND check_board_access(columns.board_id, auth.uid())
  )
);
DROP POLICY IF EXISTS "Users can create activities" ON activities;
CREATE POLICY "Users can create activities" ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions & Triggers
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
