export interface Brand {
  id: string
  user_id: string
  name: string
  logo_url: string | null
  created_at: string
  updated_at: string
}

export interface Shop {
  id: string
  user_id: string
  name: string
  logo_url: string | null
  template_config: any
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  brand_id: string
  name: string
  description: string | null
  raw_image_url: string | null
  generated_image_url?: string | null
  created_at: string
  updated_at: string
}

export interface ProductTemplate {
  id: string
  product_id: string
  shop_id: string
  template_config: any
  generated_image_url?: string | null
  created_at: string
  updated_at: string
}

export * from './orders'
