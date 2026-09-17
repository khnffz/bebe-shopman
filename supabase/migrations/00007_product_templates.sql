-- Create Product Templates Table
create table if not exists public.product_templates (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  shop_id uuid references public.shops(id) on delete cascade not null,
  template_config jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint product_templates_product_shop_key unique (product_id, shop_id)
);

-- Enable RLS
alter table public.product_templates enable row level security;

-- Policies for RLS
drop policy if exists "Users can view own product templates" on public.product_templates;
create policy "Users can view own product templates" on public.product_templates
  for select using (
    exists (select 1 from public.shops where id = shop_id and user_id = auth.uid())
  );

drop policy if exists "Users can insert own product templates" on public.product_templates;
create policy "Users can insert own product templates" on public.product_templates
  for insert with check (
    exists (select 1 from public.shops where id = shop_id and user_id = auth.uid())
  );

drop policy if exists "Users can update own product templates" on public.product_templates;
create policy "Users can update own product templates" on public.product_templates
  for update using (
    exists (select 1 from public.shops where id = shop_id and user_id = auth.uid())
  );

drop policy if exists "Users can delete own product templates" on public.product_templates;
create policy "Users can delete own product templates" on public.product_templates
  for delete using (
    exists (select 1 from public.shops where id = shop_id and user_id = auth.uid())
  );

-- Create index for faster lookups
create index if not exists idx_product_templates_lookup on public.product_templates(product_id, shop_id);
