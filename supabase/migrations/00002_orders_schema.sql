create table if not exists public.import_batches (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  platform text not null check (platform in ('shopee', 'tiktok')),
  filename text not null,
  period_start date,
  period_end date,
  total_orders int default 0,
  total_items int default 0,
  status text default 'processing' check (status in ('processing', 'completed', 'failed')),
  error_message text,
  created_at timestamptz default now()
);

-- 2. Create Orders Table
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  import_batch_id uuid references public.import_batches(id) on delete cascade not null,

  -- Identifikasi
  platform text not null check (platform in ('shopee', 'tiktok')),
  order_number text not null,
  transaction_type text,

  -- Waktu
  order_date date not null,
  payment_date date,

  -- === PENDAPATAN ===
  total_income numeric(15,2) default 0,
  product_price numeric(15,2) default 0,
  product_price_after_discount numeric(15,2) default 0,
  payment_settlement numeric(15,2) default 0,
  refund_to_buyer numeric(15,2) default 0,

  -- === DISKON & VOUCHER ===
  seller_voucher numeric(15,2) default 0,
  seller_cashback_coin numeric(15,2) default 0,
  platform_discount numeric(15,2) default 0,
  cofund_voucher_seller numeric(15,2) default 0,
  cofund_cashback_coin numeric(15,2) default 0,
  platform_voucher numeric(15,2) default 0,

  -- === ONGKOS KIRIM ===
  shipping_buyer numeric(15,2) default 0,
  shipping_to_courier numeric(15,2) default 0,
  shipping_discount_courier numeric(15,2) default 0,
  shipping_free_platform numeric(15,2) default 0,
  shipping_return numeric(15,2) default 0,
  return_to_seller_fee numeric(15,2) default 0,
  shipping_refund numeric(15,2) default 0,
  shipping_subsidy numeric(15,2) default 0,

  -- === BIAYA PLATFORM ===
  admin_fee numeric(15,2) default 0,
  processing_fee numeric(15,2) default 0,
  transaction_fee numeric(15,2) default 0,
  free_shipping_fee numeric(15,2) default 0,
  free_shipping_special_d numeric(15,2) default 0,
  free_shipping_normal_d numeric(15,2) default 0,
  free_shipping_normal_e numeric(15,2) default 0,
  free_shipping_normal_f numeric(15,2) default 0,
  free_shipping_normal_g numeric(15,2) default 0,
  free_shipping_normal_h numeric(15,2) default 0,

  -- === BIAYA LAYANAN ===
  service_transaction_fee numeric(15,2) default 0,
  service_promo_fee numeric(15,2) default 0,
  service_promo_trial_fee numeric(15,2) default 0,

  -- === BIAYA PROMOSI ===
  campaign_fee numeric(15,2) default 0,
  ads_commission_fee numeric(15,2) default 0,
  auto_topup_fee numeric(15,2) default 0,

  -- === BIAYA LAINNYA ===
  premium_fee numeric(15,2) default 0,
  fbs_fee numeric(15,2) default 0,
  other_transaction_fee numeric(15,2) default 0,

  -- === BIAYA KHUSUS TIKTOK ===
  affiliate_commission numeric(15,2) default 0,
  affiliate_partner_commission numeric(15,2) default 0,
  affiliate_shop_ads numeric(15,2) default 0,
  affiliate_deposit numeric(15,2) default 0,
  affiliate_refund numeric(15,2) default 0,
  affiliate_partner_shop_ads numeric(15,2) default 0,
  free_shipping_program_fee numeric(15,2) default 0,
  dynamic_commission numeric(15,2) default 0,
  cashback_service_fee numeric(15,2) default 0,
  live_service_fee numeric(15,2) default 0,
  exclusive_access_fee numeric(15,2) default 0,
  eams_fee numeric(15,2) default 0,
  flash_sale_fee numeric(15,2) default 0,
  tokopedia_fee numeric(15,2) default 0,
  tokopedia_handling_fee numeric(15,2) default 0,
  paylater_fee numeric(15,2) default 0,
  campaign_resource_fee numeric(15,2) default 0,
  installation_fee numeric(15,2) default 0,
  platform_special_fee numeric(15,2) default 0,
  gmv_max_ads_fee numeric(15,2) default 0,
  gmv_max_voucher numeric(15,2) default 0,
  gmv_max_voucher_tax numeric(15,2) default 0,
  managed_service_tax numeric(15,2) default 0,
  managed_service_fee numeric(15,2) default 0,
  failed_delivery_shipping numeric(15,2) default 0,
  buyer_fault_return_shipping numeric(15,2) default 0,
  insurance_fee numeric(15,2) default 0,
  logistics_service_fee numeric(15,2) default 0,
  insurance_refund numeric(15,2) default 0,
  credit_card_fee numeric(15,2) default 0,
  horison_product_fee numeric(15,2) default 0,
  horison_shipping_fee numeric(15,2) default 0,
  shipping_replacement numeric(15,2) default 0,
  shipping_exchange numeric(15,2) default 0,

  -- === PAJAK ===
  pph22 numeric(15,2) default 0,

  -- === INFO PEMBELI ===
  buyer_username text,
  buyer_payment_amount numeric(15,2) default 0,
  payment_method text,
  payment_detail text,
  installment_plan text,

  -- === PENGIRIMAN ===
  seller_free_shipping_promo numeric(15,2) default 0,
  courier_service text,
  courier_name text,
  voucher_code text,

  -- === KOMPENSASI ===
  compensation numeric(15,2) default 0,

  -- === REFUND DETAIL ===
  refund_coin_prorate numeric(15,2) default 0,
  refund_voucher_prorate numeric(15,2) default 0,
  refund_bank_promo_prorate numeric(15,2) default 0,
  refund_shopee_promo_prorate numeric(15,2) default 0,

  -- === INFO TAMBAHAN TIKTOK ===
  currency text default 'IDR',
  tiktok_related_order_id text,
  tiktok_buyer_payment numeric(15,2) default 0,
  tiktok_buyer_refund numeric(15,2) default 0,
  tiktok_seller_voucher_discount numeric(15,2) default 0,
  tiktok_seller_voucher_refund numeric(15,2) default 0,
  tiktok_platform_discount numeric(15,2) default 0,
  tiktok_platform_discount_refund numeric(15,2) default 0,
  tiktok_platform_voucher_discount numeric(15,2) default 0,
  tiktok_platform_voucher_refund numeric(15,2) default 0,
  tiktok_buyer_shipping_before_discount numeric(15,2) default 0,
  tiktok_seller_shipping_discount numeric(15,2) default 0,
  tiktok_platform_shipping numeric(15,2) default 0,
  package_weight numeric(10,2) default 0,
  chargeable_weight numeric(10,2) default 0,
  order_source text,
  commission_before_discount numeric(15,2) default 0,
  ads_spending_discount numeric(15,2) default 0,
  other_commission_discount numeric(15,2) default 0,
  adjustment_amount numeric(15,2) default 0,

  -- Metadata
  release_method text,
  order_type text,
  application_number text,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Constraint unik: 1 order number per platform per batch
  unique(import_batch_id, platform, order_number)
);

-- 3. Create Order Items Table
create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,

  platform_product_id text,
  product_name text,
  quantity int default 1,

  -- Keuangan per item
  item_total_income numeric(15,2) default 0,
  item_product_price numeric(15,2) default 0,
  item_refund numeric(15,2) default 0,

  -- Ongkir per item
  item_shipping_buyer numeric(15,2) default 0,
  item_shipping_to_courier numeric(15,2) default 0,
  item_shipping_discount numeric(15,2) default 0,
  item_shipping_free_platform numeric(15,2) default 0,
  item_shipping_return numeric(15,2) default 0,
  item_return_to_seller_fee numeric(15,2) default 0,
  item_shipping_refund numeric(15,2) default 0,

  -- Diskon per item
  item_seller_voucher numeric(15,2) default 0,
  item_seller_cashback numeric(15,2) default 0,
  item_platform_discount numeric(15,2) default 0,
  item_cofund_voucher numeric(15,2) default 0,
  item_cofund_cashback numeric(15,2) default 0,

  -- Biaya per item
  item_admin_fee numeric(15,2) default 0,
  item_processing_fee numeric(15,2) default 0,
  item_free_shipping_special_d numeric(15,2) default 0,
  item_free_shipping_normal_d numeric(15,2) default 0,
  item_free_shipping_normal_e numeric(15,2) default 0,
  item_free_shipping_normal_f numeric(15,2) default 0,
  item_free_shipping_normal_g numeric(15,2) default 0,
  item_free_shipping_normal_h numeric(15,2) default 0,
  item_service_transaction_fee numeric(15,2) default 0,
  item_service_promo_trial_fee numeric(15,2) default 0,
  item_service_promo_fee numeric(15,2) default 0,
  item_campaign_fee numeric(15,2) default 0,
  item_ads_commission_fee numeric(15,2) default 0,
  item_auto_topup_fee numeric(15,2) default 0,
  item_premium_fee numeric(15,2) default 0,
  item_fbs_fee numeric(15,2) default 0,
  item_other_transaction_fee numeric(15,2) default 0,
  item_pph22 numeric(15,2) default 0,

  -- Metadata
  item_application_number text,

  created_at timestamptz default now()
);

-- 4. Enable RLS
alter table public.import_batches enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- 5. Create RLS Policies
create policy "Users manage own imports" on public.import_batches
  for all using (auth.uid() = user_id);

create policy "Users manage own orders" on public.orders
  for all using (auth.uid() = user_id);

create policy "Users view own order items" on public.order_items
  for select using (
    exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
  );
create policy "Users insert own order items" on public.order_items
  for insert with check (
    exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
  );
create policy "Users delete own order items" on public.order_items
  for delete using (
    exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
  );

-- 6. Create Indexes
create index idx_orders_user_platform on public.orders(user_id, platform);
create index idx_orders_order_date on public.orders(order_date);
create index idx_orders_batch on public.orders(import_batch_id);
create index idx_order_items_order on public.order_items(order_id);
create index idx_order_items_product on public.order_items(platform_product_id);
