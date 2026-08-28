# Development Issues: Aplikasi Image Generator & Editor Produk E-Commerce

Berikut adalah 5 tahapan logis pengembangan aplikasi yang dibagi menjadi 5 issue untuk meminimalisir bug dan memudahkan proses pengembangan:

## Tahap 1: Fondasi Proyek, Autentikasi, & Database
**Fokus:** Membangun tulang punggung aplikasi dan keamanan data.
**Role:** Expert Next.js 14+ (App Router), Tailwind CSS, and Supabase Developer.

**Task:**
1. Initialize a Next.js project with Tailwind CSS and TypeScript.
2. Create Supabase client utilities in `src/lib/supabase` (server and client).
3. Provide the exact SQL script to create tables with Row Level Security (RLS) enabled. Include:
   - `brands`: id (uuid), user_id (uuid), name (text), logo_url (text).
   - `shops`: id (uuid), user_id (uuid), name (text), logo_url (text), template_config (jsonb).
   - `products`: id (uuid), brand_id (uuid), name (text), description (text), raw_image_url (text).
   - `storage buckets`: 'assets' (for logos and raw images).
4. Create a clean Auth page (`/auth`) for Login/Register using Supabase Auth.
5. Create a protected layout for `/dashboard` with a sidebar navigation (Brands, Shops, Products). Redirect unauthenticated users to `/auth`.

---

## Tahap 2: Manajemen Aset Visual (Brands & Shops)
**Fokus:** Mengganti tabel kaku dengan UI Image Gallery yang modern.
**Role:** Expert Frontend UI/UX Developer using Next.js and Tailwind CSS.

**Task:**
1. Build the CRUD interface for `/dashboard/brands` and `/dashboard/shops`.
2. UI Requirement: DO NOT use traditional data tables. Use a responsive Image Gallery Grid layout (e.g., masonry or uniform grid).
3. Each item card should display the logo as the main visual, with the name overlaid or below it.
4. Hover state on the cards should reveal action buttons: "Edit", "Delete", and specifically for Shops: "Template Settings".
5. Integrate Supabase Storage to handle logo uploads (PNG/JPG) during the Create/Edit process. Include a loading state during image upload.

---

## Tahap 3: Interactive Template Builder (Fabric.js)
**Fokus:** Membangun kanvas dinamis untuk mengatur layout per Shop.
**Role:** Expert React Developer with advanced Canvas API and Fabric.js experience.

**Task:**
1. Create a dynamic page at `/dashboard/shops/[id]/template`.
2. Integrate `fabric.js` to create an interactive canvas workspace.
3. Features to implement on the canvas:
   - Add/Edit Text (configurable standard fonts + load external fonts like Agradir and Comfortaa via Google Fonts/local assets).
   - Configure Text: Color, Size, Line Height.
   - Add Image Placeholders: Allow users to define the size and position for "Shop Logo", "Brand Logo", and "Main Product".
   - Drag, drop, scale, and rotate functionality for all canvas objects.
4. Create a "Save Template" button that serializes the Fabric.js canvas state into JSON (`canvas.toJSON()`) and saves it to the `template_config` column in the `shops` table via Supabase.
5. Implement a load function to parse `template_config` back onto the canvas when the user re-enters the page.

---

## Tahap 4: Manajemen Produk & API AI Routes
**Fokus:** CRUD produk master dan setup Next.js API Routes sebagai proxy ke AI.
**Role:** Fullstack Next.js Developer with API Integration expertise.

**Task:**
1. Build the CRUD for `/dashboard/products`. Use a split view or standard layout displaying: Product Title, Description, Brand (Dropdown), and Raw Image Upload.
2. Inside the Product detail/edit page, add a prominent "Generate Product Images" button that opens a modal.
3. The modal should fetch and display all available `shops` as checkboxes.
4. Set up two backend API routes in Next.js to hide API keys:
   - `app/api/remove-bg/route.ts`: Proxies image data to Hugging Face Inference API (`briaai/RMBG-1.4`) to return a transparent PNG.
   - `app/api/generate-scene/route.ts`: Proxies data to Hugging Face Stable Diffusion API to generate aesthetic background scenes based on a text prompt.

---

## Tahap 5: Core Generation Pipeline (The Engine)
**Fokus:** Eksekusi hapus background, perbaikan gambar di sisi klien, dan render final.
**Role:** Expert Image Processing and React Developer.

**Task:** Build the generation pipeline triggered from the Product Modal.
Workflow for each selected Shop:
1. Call `/api/remove-bg` with the `raw_image_url`. Wait for the transparent PNG.
2. Headless Fabric.js Processing (Client-side):
   - Load the Shop's `template_config` JSON.
   - Insert the transparent Product PNG into the designated product placeholder.
   - Apply client-side image filters (Brightness, Contrast) and a classy Drop Shadow to the product image using Fabric.js built-in filters. DO NOT use AI for this.
   - Insert the corresponding Brand Logo and Shop Logo into their placeholders.
   - Replace placeholder texts with the actual Product Title and Description.
   - Export this canvas as the "Main Product Image" (DataURL).
3. Call `/api/generate-scene` to get an aesthetic background, then composite the product and texts over it to create 4 "Support Product Images".
4. Display the generated images (1 Main + 4 Support) in a preview gallery.
5. Provide a "Download All" button (optionally using `jszip` to zip them together).
