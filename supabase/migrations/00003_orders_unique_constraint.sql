alter table public.orders drop constraint if exists orders_import_batch_id_platform_order_number_key;
alter table public.orders add constraint orders_user_id_platform_order_number_key unique(user_id, platform, order_number);
