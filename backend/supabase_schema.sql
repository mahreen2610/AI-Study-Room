-- Enable the pgvector extension to work with embeddings
create extension if not exists vector;

-- 1. Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text not null,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Rooms Table
create table public.rooms (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  invite_code varchar(8) unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Rooms
alter table public.rooms enable row level security;

-- 3. Room Members Table
create table public.room_members (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('owner', 'member')) not null default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(room_id, user_id)
);

-- Enable RLS on Room Members
alter table public.room_members enable row level security;

-- Policies for Room Members
create policy "Allow members to see membership details" on public.room_members
  for select using (
    auth.uid() in (select user_id from public.room_members where room_id = room_members.room_id)
  );

create policy "Allow member creation on invite join" on public.room_members
  for insert with check (auth.uid() = user_id);

-- Policies for Rooms
create policy "Allow members to view rooms" on public.rooms
  for select using (
    exists (
      select 1 from public.room_members 
      where room_members.room_id = rooms.id and room_members.user_id = auth.uid()
    )
  );

create policy "Allow authenticated users to create rooms" on public.rooms
  for insert with check (auth.uid() = owner_id);

-- 4. Documents Table
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  uploaded_by uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  storage_path text not null,
  status text check (status in ('processing', 'ready', 'failed')) not null default 'processing',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Documents
alter table public.documents enable row level security;

create policy "Allow members to view documents" on public.documents
  for select using (
    exists (
      select 1 from public.room_members 
      where room_members.room_id = documents.room_id and room_members.user_id = auth.uid()
    )
  );

create policy "Allow members to insert documents" on public.documents
  for insert with check (
    exists (
      select 1 from public.room_members 
      where room_members.room_id = documents.room_id and room_members.user_id = auth.uid()
    )
  );

create policy "Allow members to update document status" on public.documents
  for update using (
    exists (
      select 1 from public.room_members 
      where room_members.room_id = documents.room_id and room_members.user_id = auth.uid()
    )
  );

-- 5. Document Chunks Table
create table public.document_chunks (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references public.documents(id) on delete cascade not null,
  room_id uuid references public.rooms(id) on delete cascade not null,
  content text not null,
  embedding vector(768),
  chunk_index integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Document Chunks
alter table public.document_chunks enable row level security;

create policy "Allow members to view document chunks" on public.document_chunks
  for select using (
    exists (
      select 1 from public.room_members 
      where room_members.room_id = document_chunks.room_id and room_members.user_id = auth.uid()
    )
  );

create policy "Allow service role or room members to insert chunks" on public.document_chunks
  for insert with check (
    exists (
      select 1 from public.room_members 
      where room_members.room_id = document_chunks.room_id and room_members.user_id = auth.uid()
    )
  );

-- 6. Messages Table (Human Chat)
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Messages
alter table public.messages enable row level security;

create policy "Allow members to view messages" on public.messages
  for select using (
    exists (
      select 1 from public.room_members 
      where room_members.room_id = messages.room_id and room_members.user_id = auth.uid()
    )
  );

create policy "Allow members to post messages" on public.messages
  for insert with check (
    auth.uid() = user_id and exists (
      select 1 from public.room_members 
      where room_members.room_id = messages.room_id and room_members.user_id = auth.uid()
    )
  );

-- 7. AI Messages Table (RAG Chat)
create table public.ai_messages (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('user', 'assistant')) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on AI Messages
alter table public.ai_messages enable row level security;

create policy "Allow members to view AI messages" on public.ai_messages
  for select using (
    exists (
      select 1 from public.room_members 
      where room_members.room_id = ai_messages.room_id and room_members.user_id = auth.uid()
    )
  );

create policy "Allow members to post AI messages" on public.ai_messages
  for insert with check (
    auth.uid() = user_id and exists (
      select 1 from public.room_members 
      where room_members.room_id = ai_messages.room_id and room_members.user_id = auth.uid()
    )
  );

-- 8. Similarity Search Function
create or replace function public.match_chunks(
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_room_id uuid
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  where dc.room_id = p_room_id
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 9. Realtime Setup
-- Enable real-time updates for messages and documents tables
-- Run these commands in your Supabase SQL Editor to enable real-time replication:
-- alter publication supabase_realtime add table public.messages;
-- alter publication supabase_realtime add table public.documents;

