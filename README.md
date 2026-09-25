# Storefront

A Next.js storefront for a contemporary clothing label. It combines the customer-facing catalogue and shared cart with Supabase persistence and a server-side Razorpay checkout flow while preserving the animated landing experience and product carousels.

## Current experience

- Animated logo introduction that transitions into the fixed navigation bar
- Responsive homepage with hero, Tops and Bottoms collections, editorial imagery, support links and socials
- Supabase-backed products, images, variants and variant-level inventory, with a six-product local fallback
- Product search, category filters, size and colour filters, and sorting
- Product detail pages with variant selection and stock feedback
- Quick view and quick add with explicit size and colour selection
- Persistent wishlist
- One shared cart across the homepage, shop, product, wishlist, cart and checkout pages
- Browser-scoped guest carts and cross-device carts for authenticated customers
- One-time guest-to-customer cart merge after login
- Cart quantity limits, live totals and free-shipping progress
- Responsive desktop and mobile layouts

The supplied brand mark is exported as transparent black and white web assets under `public/brand`.

## Architecture

The complete V1 architecture, database model, security rules, checkout flow and team ownership are documented in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

Deploy the complete application to Vercel or another server-capable Next.js host. Static hosting cannot run the cart, authentication, payment verification or webhook route handlers.

## Technology

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- Lucide icons
- Supabase PostgreSQL and Auth
- Razorpay

## Run locally

Requirements:

- Node.js 20 or newer
- npm

Copy `.env.example` to `.env.local`, add the Supabase and Razorpay credentials, then install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Create a production build with:

```bash
npm run build
```

## Storefront data model

Catalogue data is loaded from the Supabase schema in `supabase/migrations`. `app/lib/data.ts` remains a local fallback for development without credentials. Each purchasable option is a variant with:

- Variant ID
- SKU
- Size
- Colour
- Price in paise
- Stock quantity

The cart stores the product ID, variant ID, size, colour, quantity, price snapshot, product image and product name.

## Cart and wishlist state

`StoreProvider` is the single client-side state boundary for cart and wishlist behavior. With Supabase configured, guest carts are associated with an HTTP-only browser token. Authenticated carts are associated with the Supabase user ID and therefore follow the customer across devices. The first authenticated request merges any guest cart into the user cart. Without Supabase credentials, local storage provides a development fallback.

## Checkout and payments

Checkout sends only variant IDs and quantities as purchasing authority. The server reloads catalogue price and stock, creates the Razorpay order, stores immutable order snapshots and reserves inventory. Browser callbacks and signed webhooks both finalize payment through the idempotent database function. Guest confirmation pages require a hashed, expiring order-access token.

## Deployment

The CI workflow builds pull requests and `main` with Node.js 20. Production should deploy to Vercel without `output: 'export'` so all route handlers remain available.

Supabase and Razorpay secrets must be configured only in the deployment environment. `SUPABASE_SECRET_KEY`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` must never use a `NEXT_PUBLIC_` variable or be exposed to client-side code.
