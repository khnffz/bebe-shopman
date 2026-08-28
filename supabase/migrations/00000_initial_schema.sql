-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create Brands Table
create table public.brands (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  logo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Shops Table
create table public.shops (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  logo_url text,
  template_config jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Products Table
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  brand_id uuid references public.brands(id) on delete cascade not null,
  name text not null,
  description text,
  raw_image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Row Level Security (RLS)
alter table public.brands enable row level security;
alter table public.shops enable row level security;
alter table public.products enable row level security;

-- 5. Create RLS Policies
-- Brands: Users can only see, insert, update, delete their own brands
create policy "Users can view own brands" on public.brands for select using (auth.uid() = user_id);
create policy "Users can insert own brands" on public.brands for insert with check (auth.uid() = user_id);
create policy "Users can update own brands" on public.brands for update using (auth.uid() = user_id);
create policy "Users can delete own brands" on public.brands for delete using (auth.uid() = user_id);

-- Shops: Users can only see, insert, update, delete their own shops
create policy "Users can view own shops" on public.shops for select using (auth.uid() = user_id);
create policy "Users can insert own shops" on public.shops for insert with check (auth.uid() = user_id);
create policy "Users can update own shops" on public.shops for update using (auth.uid() = user_id);
create policy "Users can delete own shops" on public.shops for delete using (auth.uid() = user_id);

-- Products: Users can only manage products if they own the related brand
create policy "Users can view products of own brands" on public.products for select using (
  exists (select 1 from public.brands where id = brand_id and user_id = auth.uid())
);
create policy "Users can insert products to own brands" on public.products for insert with check (
  exists (select 1 from public.brands where id = brand_id and user_id = auth.uid())
);
create policy "Users can update products of own brands" on public.products for update using (
  exists (select 1 from public.brands where id = brand_id and user_id = auth.uid())
);
create policy "Users can delete products of own brands" on public.products for delete using (
  exists (select 1 from public.brands where id = brand_id and user_id = auth.uid())
);

-- 6. Setup Storage Bucket for Assets
insert into storage.buckets (id, name, public) values ('assets', 'assets', true)
on conflict (id) do nothing;

-- 7. Storage Policies
create policy "Public Access to assets" on storage.objects for select using (bucket_id = 'assets');
create policy "Authenticated users can upload assets" on storage.objects for insert with check (
  bucket_id = 'assets' and auth.role() = 'authenticated'
);
create policy "Authenticated users can update own assets" on storage.objects for update using (
  bucket_id = 'assets' and auth.uid() = owner
);
create policy "Authenticated users can delete own assets" on storage.objects for delete using (
  bucket_id = 'assets' and auth.uid() = owner
);
