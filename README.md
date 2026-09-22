# Storefront

A Next.js storefront for a contemporary clothing label. The current implementation covers the customer-facing catalogue, product variants, search, filtering, wishlist and a shared persistent cart while preserving the animated landing experience and product carousels.

## Current experience

- Animated logo introduction that transitions into the fixed navigation bar
- Responsive homepage with hero, Tops and Bottoms collections, editorial imagery, support links and socials
- Six seeded products represented by 54 size and colour variants
- Product search, category filters, size and colour filters, and sorting
- Product detail pages with variant selection and stock feedback
- Quick view and quick add with explicit size and colour selection
- Persistent wishlist
- Shared cart across the homepage, shop, product, wishlist and cart pages
- Cart quantity limits, live totals and free-shipping progress
- Responsive desktop and mobile layouts

The supplied brand mark is exported as transparent black and white web assets under `public/brand`.

## Architecture

The complete V1 architecture, database model, security rules, checkout flow and team ownership are documented in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

The current GitHub Pages deployment is a storefront preview. The complete Supabase and Razorpay implementation requires a server-capable Next.js deployment on Vercel because static exports cannot run route handlers, authentication middleware, payment verification or webhooks.

## Technology

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- Lucide icons
- Static export for GitHub Pages

## Run locally

Requirements:

- Node.js 20 or newer
- npm

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Create a production build with:

```bash
npm run build
```

To verify the same base path used by the GitHub Pages workflow:

```bash
GITHUB_PAGES=true npm run build
```

In PowerShell:

```powershell
$env:GITHUB_PAGES='true'
npm run build
```

## Storefront data model

Catalogue data currently lives in `app/lib/data.ts`. Each purchasable option is a variant with:

- Variant ID
- SKU
- Size
- Colour
- Price in paise
- Stock quantity

The cart stores the product ID, variant ID, size, colour, quantity, price snapshot, product image and product name.

## Cart and wishlist state

`StoreProvider` is the single client-side state boundary for cart and wishlist behavior. It persists both in browser storage so navigation and reloads retain the customer's selections.

When the Supabase backend is introduced, this provider should remain the page-facing interface while its persistence layer is replaced with database-backed guest and authenticated carts. This avoids adding separate cart state to individual pages.

## Planned backend integration

The remaining platform work belongs to the database/authentication and checkout/payment tracks:

- Supabase PostgreSQL schema and migrations
- Supabase authentication, profiles and addresses
- Database-backed carts and guest-to-account cart merging
- Row-level security and server-side admin authorization
- Server-authoritative checkout totals and stock reservations
- Razorpay order creation and signature verification in Next.js route handlers
- Razorpay webhook processing and idempotent stock decrement
- Order history and protected guest order access
- Admin catalogue, inventory, fulfilment and refund operations

Client-side prices and stock in the current static catalogue are suitable for the storefront prototype. The production checkout must reload variants from PostgreSQL and validate price and availability server-side before creating a Razorpay order.

## Deployment

Pushes to `main` are currently built and published as a static preview by `.github/workflows/deploy-pages.yml`. The build sets `GITHUB_PAGES=true`, which applies the `/crispy-engine` base path and prefixes local brand assets correctly.

The production V1 should deploy to Vercel without `output: 'export'`. That deployment will run the required Next.js route handlers for authentication, carts, checkout, Razorpay verification and webhooks.

Future Supabase and Razorpay secrets must be configured only in the deployment environment. Razorpay secret keys and Supabase service-role credentials must never use a `NEXT_PUBLIC_` variable or be exposed to client-side code.
