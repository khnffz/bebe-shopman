-- Migration: Add shop_id to orders, order_items, and import_batches
-- Also update get_report_summary RPC to support shop_id filter

-- 1. Add shop_id columns
alter table public.import_batches 
add column if not exists shop_id uuid references public.shops(id) on delete set null;

alter table public.orders 
add column if not exists shop_id uuid references public.shops(id) on delete set null;

alter table public.order_items 
add column if not exists shop_id uuid references public.shops(id) on delete set null;

-- 2. Add indexes
create index if not exists idx_import_batches_shop_id on public.import_batches(shop_id);
create index if not exists idx_orders_shop_id on public.orders(shop_id);
create index if not exists idx_order_items_shop_id on public.order_items(shop_id);

-- 3. Update get_report_summary function to accept p_shop_id
create or replace function public.get_report_summary(
  p_user_id uuid,
  p_platform text default null,
  p_from date default null,
  p_to date default null,
  p_shop_id uuid default null
)
returns json
language plpgsql
security definer
as $$
declare
  v_summary json;
begin
  with filtered_orders as (
    select *
    from public.orders
    where user_id = p_user_id
      and (p_platform is null or p_platform = 'all' or platform = p_platform)
      and (p_shop_id is null or shop_id = p_shop_id)
      and (p_from is null or order_date >= p_from)
      and (p_to is null or order_date <= p_to)
  ),
  platform_aggs as (
    select
      -- Revenue, Released, Expenses
      coalesce(sum(total_income), 0) as total_revenue,
      coalesce(sum(case when platform = 'tiktok' then payment_settlement else total_income end), 0) as total_released,
      coalesce(sum(
        case 
          when platform = 'tiktok' then (payment_settlement - total_income - coalesce(adjustment_amount, 0))
          else (
            coalesce(shipping_buyer, 0) + coalesce(shipping_to_courier, 0) + coalesce(shipping_discount_courier, 0) +
            coalesce(shipping_free_platform, 0) + coalesce(shipping_return, 0) + coalesce(return_to_seller_fee, 0) +
            coalesce(shipping_refund, 0) + coalesce(admin_fee, 0) + coalesce(processing_fee, 0) +
            coalesce(free_shipping_special_d, 0) + coalesce(free_shipping_normal_d, 0) + coalesce(free_shipping_normal_e, 0) +
            coalesce(free_shipping_normal_f, 0) + coalesce(free_shipping_normal_g, 0) + coalesce(free_shipping_normal_h, 0) +
            coalesce(service_transaction_fee, 0) + coalesce(transaction_fee, 0) + coalesce(service_promo_trial_fee, 0) + coalesce(service_promo_fee, 0) +
            coalesce(campaign_fee, 0) + coalesce(ads_commission_fee, 0) + coalesce(auto_topup_fee, 0) +
            coalesce(premium_fee, 0) + coalesce(fbs_fee, 0) + coalesce(other_transaction_fee, 0) + coalesce(pph22, 0)
          )
        end
      ), 0) as total_expenses,

      -- Subtotal
      coalesce(sum(product_price), 0) as product_price,
      coalesce(sum(refund_to_buyer), 0) as refund_to_buyer,

      -- Vouchers
      coalesce(sum(seller_voucher), 0) as seller_voucher,
      coalesce(sum(seller_cashback_coin), 0) as seller_cashback_coin,
      coalesce(sum(platform_discount), 0) as platform_discount,
      coalesce(sum(cofund_voucher_seller), 0) as cofund_voucher_seller,
      coalesce(sum(cofund_cashback_coin), 0) as cofund_cashback_coin,
      coalesce(sum(platform_voucher), 0) as platform_voucher,

      -- Shipping
      coalesce(sum(shipping_buyer), 0) as shipping_buyer,
      coalesce(sum(shipping_to_courier), 0) as shipping_to_courier,
      coalesce(sum(shipping_discount_courier), 0) as shipping_discount_courier,
      coalesce(sum(shipping_free_platform), 0) as shipping_free_platform,
      coalesce(sum(shipping_return), 0) as shipping_return,
      coalesce(sum(return_to_seller_fee), 0) as return_to_seller_fee,
      coalesce(sum(shipping_refund), 0) as shipping_refund,

      -- Platform fees
      coalesce(sum(admin_fee), 0) as admin_fee,
      coalesce(sum(processing_fee), 0) as processing_fee,

      -- Free shipping
      coalesce(sum(free_shipping_special_d), 0) as special_d,
      coalesce(sum(free_shipping_normal_d), 0) as normal_d,
      coalesce(sum(free_shipping_normal_e), 0) as normal_e,
      coalesce(sum(free_shipping_normal_f), 0) as normal_f,
      coalesce(sum(free_shipping_normal_g), 0) as normal_g,
      coalesce(sum(free_shipping_normal_h), 0) as normal_h,
      coalesce(sum(free_shipping_program_fee), 0) as tiktok_free_shipping,

      -- Service fees
      coalesce(sum(coalesce(service_transaction_fee, transaction_fee)), 0) as transaction_fee,
      coalesce(sum(service_promo_trial_fee), 0) as promo_trial_fee,
      coalesce(sum(coalesce(service_promo_fee, cashback_service_fee)), 0) as promo_service_fee,

      -- Promotion fees
      coalesce(sum(campaign_fee), 0) as campaign_fee,
      coalesce(sum(coalesce(ads_commission_fee, gmv_max_ads_fee)), 0) as ads_commission,
      coalesce(sum(auto_topup_fee), 0) as auto_topup,

      -- Other fees
      coalesce(sum(coalesce(premium_fee, insurance_fee)), 0) as premium_fee,
      coalesce(sum(fbs_fee), 0) as fbs_fee,
      coalesce(sum(other_transaction_fee), 0) as other_transaction,
      coalesce(sum(coalesce(affiliate_commission, 0) + coalesce(affiliate_partner_commission, 0)), 0) as affiliate_commission,
      coalesce(sum(live_service_fee), 0) as live_service_fee,
      coalesce(sum(paylater_fee), 0) as paylater_fee,
      coalesce(sum(coalesce(tokopedia_fee, 0) + coalesce(tokopedia_handling_fee, 0)), 0) as tokopedia_fee,
      coalesce(sum(dynamic_commission), 0) as dynamic_commission,

      -- Tax
      coalesce(sum(pph22), 0) as pph22
    from filtered_orders
  )
  select json_build_object(
    'totalRevenue', total_revenue,
    'totalExpenses', total_expenses,
    'totalReleased', total_released,
    'subtotalOrders', json_build_object(
      'total', product_price + refund_to_buyer,
      'productPrice', product_price,
      'refundToBuyer', refund_to_buyer
    ),
    'voucherSubsidy', json_build_object(
      'total', seller_voucher + seller_cashback_coin + platform_discount + cofund_voucher_seller + cofund_cashback_coin + platform_voucher,
      'sellerVoucher', seller_voucher,
      'sellerCashbackCoin', seller_cashback_coin,
      'platformDiscount', platform_discount,
      'cofundVoucherSeller', cofund_voucher_seller,
      'cofundCashbackCoin', cofund_cashback_coin,
      'platformVoucher', platform_voucher
    ),
    'shippingCosts', json_build_object(
      'total', shipping_buyer + shipping_to_courier + shipping_discount_courier + shipping_free_platform + shipping_return + return_to_seller_fee + shipping_refund,
      'buyerShipping', shipping_buyer,
      'toCourier', shipping_to_courier,
      'courierDiscount', shipping_discount_courier,
      'freePlatform', shipping_free_platform,
      'returnShipping', shipping_return,
      'returnToSellerFee', return_to_seller_fee,
      'shippingRefund', shipping_refund
    ),
    'platformFees', json_build_object(
      'total', admin_fee + processing_fee,
      'adminFee', admin_fee,
      'processingFee', processing_fee
    ),
    'freeShippingFees', json_build_object(
      'total', special_d + normal_d + normal_e + normal_f + normal_g + normal_h + tiktok_free_shipping,
      'specialD', special_d,
      'normalD', normal_d,
      'normalE', normal_e,
      'normalF', normal_f,
      'normalG', normal_g,
      'normalH', normal_h,
      'tiktokFreeShipping', tiktok_free_shipping
    ),
    'serviceFees', json_build_object(
      'total', transaction_fee + promo_trial_fee + promo_service_fee,
      'transactionFee', transaction_fee,
      'promoTrialFee', promo_trial_fee,
      'promoServiceFee', promo_service_fee
    ),
    'promotionFees', json_build_object(
      'total', campaign_fee + ads_commission + auto_topup,
      'campaignFee', campaign_fee,
      'adsCommission', ads_commission,
      'autoTopup', auto_topup
    ),
    'otherFees', json_build_object(
      'total', premium_fee + fbs_fee + other_transaction + affiliate_commission + live_service_fee + paylater_fee + tokopedia_fee + dynamic_commission,
      'premiumFee', premium_fee,
      'fbsFee', fbs_fee,
      'otherTransaction', other_transaction,
      'affiliateCommission', affiliate_commission,
      'liveServiceFee', live_service_fee,
      'paylaterFee', paylater_fee,
      'tokopediaFee', tokopedia_fee,
      'dynamicCommission', dynamic_commission
    ),
    'tax', json_build_object(
      'total', pph22,
      'pph22', pph22
    )
  ) into v_summary
  from platform_aggs;

  return v_summary;
end;
$$;
