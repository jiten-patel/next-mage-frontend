# Stepozo: Headless Magento 2 Storefront

A headless e-commerce storefront for a footwear brand. **Next.js 15 (App Router)** handles the UI,
and **Magento 2.4** is the commerce engine behind it, reached only through its **GraphQL API**.

Catalog, cart, checkout and the customer account all run against real Magento data. The browser never calls
Magento: every request goes through React Server Components and Server Actions.

<!-- Screenshots: add images to public/screenshots/ and link them here, e.g.
![Home](public/screenshots/home.png)
-->

## Features

**Catalog**
- Category pages with layered navigation (filters built from Magento aggregations), sorting and pagination
- Product pages for **simple, configurable, bundle, grouped and downloadable** products
- Breadcrumbs, image gallery, loading skeletons

**Cart & Checkout**
- Guest and customer carts, with a mini-cart in the header
- The guest cart is **merged into the customer cart on login**
- One-page checkout: email, shipping/billing address (or a saved address), shipping method, payment method,
  coupon code, place order and a success page

**Customer Account**
- Register, login, logout, forgot password
- Profile, address book (add/edit/delete, default billing/shipping), order history and order details
- Wishlist (add, remove, move to cart)

## Architecture

```
Browser ──► Next.js (Server Components / Server Actions) ──► Magento 2 GraphQL
               │                                                   │
               └─ HttpOnly cookies: customer token, guest cart id  └─ Docker: Nginx, PHP-FPM, MariaDB,
                                                                      OpenSearch, Valkey
```

Key design decisions:

- **Server-only data access.** Every request goes through one `gql()` helper in [`src/lib/magento.js`](src/lib/magento.js).
  It is marked `server-only`, so the Magento URL and tokens never reach the client, and no CORS setup is needed.
- **Caching boundaries.** Public catalog queries use ISR (`revalidate: 300`). Any request that carries a customer
  token, and every mutation, uses `no-store`, so personal data never lands in the shared cache.
- **Secure sessions.** The Magento customer token lives only in an HttpOnly cookie. The cookie expires at the same
  time as the token, using `customer_access_token_lifetime` from the store config.
- **No client-side checkout state.** Each checkout step saves straight to the Magento cart, and the page re-renders
  from it. A refresh never loses progress.
- **Progressive enhancement.** Forms are Server Actions, so login, cart and checkout still work with JavaScript disabled.
- **Safe error messages.** Magento errors are mapped to friendly text. Raw backend messages, which can contain paths
  or stack traces in developer mode, are never shown to shoppers.

## Tech Stack

| Layer    | Tech                                                        |
|----------|-------------------------------------------------------------|
| Frontend | Next.js 15 (App Router, Turbopack), React 19, Tailwind CSS 3 |
| Backend  | Magento 2.4.8 (GraphQL API)                                 |
| Infra    | Docker: Nginx, PHP 8.3-FPM, MariaDB 11.4, OpenSearch 2.19, Valkey 8 |

## Project Structure

```
src/
  app/            Routes: home, category/[...slug], product/[urlKey], cart, checkout, account/*, login, register
  components/     UI: header, mini-cart, product cards/grid, category filter, product option pickers
  lib/
    magento.js    GraphQL client + error type
    auth.js       Session cookie, current customer, friendly errors
    cart.js       Guest/customer cart resolution and merge
    wishlist.js   Wishlist queries
    *-actions.js  Server Actions (forms)
scripts/          Smoke tests that drive the real forms over HTTP
```

## Getting Started

### 1. Run Magento

You need a Magento 2.4 instance with GraphQL enabled. The Luma sample data is recommended, because the
smoke tests use its catalog. This project was developed against a Dockerized Magento running at
`http://localhost:8080`.

### 2. Configure the frontend

Create `.env.local`:

```env
MAGENTO_GRAPHQL_URL=http://localhost:8080/graphql
```

If your Magento runs on a different host, also update `images.remotePatterns` in [`next.config.mjs`](next.config.mjs)
so product images can load.

### 3. Install and run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Testing

The smoke tests submit the real forms against a running server and a running Magento instance.
Run them against a production build. In dev mode, React's debug output embeds cookie values in the page,
and that makes the token-leak check fail.

```bash
npm run build && npm start
npm run test:auth       # register/login/logout, profile, addresses, session expiry, token never in HTML
npm run test:cart       # cart CRUD, guest→customer merge, coupons, full guest + customer checkout
npm run test:wishlist   # add (incl. configurable variants), remove, move to cart
npm run test:listing    # filters, sorting, pagination
```

Set `BASE_URL` to test a server on a different address (default `http://localhost:3000`).

## Author

**Jiten Patel** · [GitHub](https://github.com/jiten-patel)
