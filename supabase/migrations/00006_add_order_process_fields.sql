-- 1. Add fields to orders table
alter table public.orders 
  add column if not exists order_status text,
  add column if not exists order_substatus text,
  add column if not exists cancel_return_type text,
  add column if not exists created_time timestamptz,
  add column if not exists paid_time timestamptz,
  add column if not exists rts_time timestamptz,
  add column if not exists shipped_time timestamptz,
  add column if not exists delivered_time timestamptz,
  add column if not exists cancelled_time timestamptz,
  add column if not exists cancel_by text,
  add column if not exists cancel_reason text,
  add column if not exists tracking_id text,
  add column if not exists delivery_option text,
  add column if not exists package_id text,
  add column if not exists fulfillment_type text,
  add column if not exists warehouse_name text,
  add column if not exists buyer_message text,
  add column if not exists recipient_name text,
  add column if not exists recipient_phone text,
  add column if not exists zipcode text,
  add column if not exists country text,
  add column if not exists province text,
  add column if not exists city text,
  add column if not exists district text,
  add column if not exists village text,
  add column if not exists detail_address text,
  add column if not exists additional_address text,
  add column if not exists order_channel text,
  add column if not exists creator_handle text,
  add column if not exists tokopedia_invoice_number text,
  add column if not exists sync_status_finance boolean default false,
  add column if not exists sync_status_orders boolean default false;

-- 2. Add fields to order_items table
alter table public.order_items
  add column if not exists sku_id text,
  add column if not exists seller_sku text,
  add column if not exists variation text,
  add column if not exists qty_returned int default 0,
  add column if not exists product_category text,
  add column if not exists weight_kg numeric(10,2) default 0;

-- 3. Update existing orders to have sync_status_finance = true if they already exist,
-- assuming existing orders were imported from finance data.
update public.orders set sync_status_finance = true where id is not null;
