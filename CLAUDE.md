# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Multi-tenant POS and stock-management app (Next.js 16 App Router, React 19, Prisma 7 on PostgreSQL/Neon, Tailwind v4 + shadcn/ui). UI copy and user-facing error messages are in **Indonesian**; keep new strings consistent with that.

## Commands

Package manager is **pnpm**.

```bash
pnpm dev                 # dev server on :3000
pnpm build               # prisma generate && next build
pnpm lint                # next lint (ESLint 9, eslint.config.mjs)
pnpm prisma:generate     # regenerate client into prisma/client (also runs on postinstall)
pnpm prisma migrate dev --name <name>   # create/apply a migration
pnpm prisma:studio
pnpm prisma:seed         # runs prisma/seed.ts via tsx
```

There is no test framework configured. Verify changes with `pnpm lint` and `pnpm build` (`npx tsc --noEmit` for a quicker type check). If tsc reports syntax errors in `.next/dev/types/routes.d.ts`, that's a stale generated file from the dev server, not a source error.

Required env vars (`.env`, loaded by `prisma.config.ts` via dotenv): `DATABASE_URL`, `JWT_SECRET`.

The README is partly outdated: there is no `src/` directory, the schema lives at `prisma/schema.prisma` (not `prisma/client/`), and the `db:*` scripts it mentions don't exist; use the `prisma:*` scripts above.

## Architecture

### Data layer
- Prisma uses the new `prisma-client` generator with output at `prisma/client/`; import `PrismaClient` from `../prisma/client/client`, and use the singleton `prisma` from `@/lib/prisma` everywhere. It connects through `@prisma/adapter-neon` over WebSockets (`ws`).
- Datasource URL is set in `prisma.config.ts`, not in `schema.prisma`.

### Multi-tenancy and auth
- Every domain model hangs off `Store`. **All queries and mutations must be scoped by `session.storeId`.** Updates and deletes look up by `{ id, storeId: session.storeId }` so one tenant can't touch another tenant's rows.
- Login (`app/(auth)/login/actions.ts`) signs a JWT (`lib/jwt.ts`, `jsonwebtoken`, 30-minute expiry) and sets two cookies: `token` (httpOnly) and `token_exp` (readable by the client). `components/layout/session-watcher.tsx` reads `token_exp` on the client to handle expiry.
- `middleware.ts` verifies the token with `jose` (Edge-compatible) and redirects unauthenticated users to `/login`. Server code gets the user from `getSession()` in `lib/auth.ts`. It is wrapped in React `cache()` and re-reads `role`, `storeId` and `name` from the `User` table on each request, so deleted or demoted users lose access immediately. It returns null when the token is invalid or the user no longer exists. Pages without a session are sent to `GET /logout` (`app/(auth)/logout/route.ts`), which clears the cookies. Going straight to `/login` would loop, because the middleware only checks the JWT signature and bounces `/login` back to `/dashboard`.
- Roles are `OWNER`, `MANAGER` and `CASHIER`. The sidebar (`lib/menu.ts`) shows the full menu to every role, so **authorization is enforced in each page and server action** via helpers in `lib/auth.ts` (server-only):
  - `ACCESS` is the single role matrix (products: OWNER/MANAGER; categoryWrite, users, settings: OWNER).
  - Pages call `requirePageSession(roles?)`, which redirects to `/login` when there is no session and calls `notFound()` when the role isn't allowed.
  - Server actions call `authorizeAction(roles?, message)` first and use `session.storeId`.

### Feature module layout
Each dashboard feature under `app/dashboard/<feature>/` follows the same pattern:
- `page.tsx`: an async server component. It calls `requirePageSession`, fetches initial data from `server/queries/*` (passing `session.storeId`), and hands it to a client component.
- `server/queries/<entity>.ts`: read functions marked `import "server-only"` that take `storeId` as an argument. **Don't put reads in `"use server"` files**: every export there is a public POST endpoint, and an argument like `storeId` can be forged by the caller.
- `_actions/actions.ts`: a `"use server"` file with **mutations only**. Never accept `storeId` (or trust prices or names) from the client. Validate any client-supplied foreign IDs (category, variant) against the session's store. Mutations validate input with **zod v4** and return `{ success, message, ... }` for `useActionState`, then call `revalidatePath` on every affected route; category changes, for example, revalidate category, products and pos.
- `_components/`: client components (`*-client.tsx` top-level, forms, lists, TanStack Table `columns.tsx`).

Shared types live in `types/`. The reusable TanStack data table is in `components/ui/data-table/` (see its README), and shadcn primitives are in `components/ui/` (config in `components.json`).

### Money and quantity conventions
- Money fields (`price`, `total`, `payment`, etc.) are integer amounts in the store currency (default IDR).
- **Stock-related quantities are stored scaled ×100** (`ProductVariant.stock`, `step`, `minOrder`, `TransactionItem.quantity`) so fractional units (e.g. kg) can be stored as ints. Use `lib/stock.ts`: `toScaled` when writing to the DB, `fromScaled` when reading, and `validateQuantity`/`snapQuantity` for `discrete` vs. continuous `quantityType`. Read actions convert to display units before returning to the client (see `getPosProducts`).
- POS checkout (`app/dashboard/pos/_actions/actions.ts`) only trusts `variantId` and `quantity` from the client and loads price and names from the DB, scoped to the store. `TransactionItem` snapshots `productName`/`variantName`/`price` and has no FK to the variant. Invoice numbers come from `InvoiceCounter` (per store per WIB day, `INV-YYYYMMDD-NNNN`) incremented in the same DB transaction; `invoiceNo` is unique per store, not globally.

### Stock changes
- **Every stock change must go through `applyStockDelta` in `server/stock.ts`.** It applies an atomic, guarded increment (stock can't go negative) and writes a `StockMovement` row (`INITIAL` / `SALE` / `ADJUSTMENT`, signed `quantity`, `stockAfter`, both ×100), inside the caller's `prisma.$transaction`. New variants record their opening stock with `recordInitialStock`.
- Never set `ProductVariant.stock` to an absolute value taken from a form, because that overwrites sales made in the meantime. `updateProduct` doesn't touch the stock of existing variants; the UI changes stock only through `adjustVariantStock(variantId, delta)`.
- Invariant: `ProductVariant.stock == SUM(StockMovement.quantity)` per variant.

### Soft delete
- `Product`, `ProductVariant` and `User` are soft-deleted (`deletedAt`). **Every query on these tables must filter `deletedAt: null`** unless it deliberately shows history (stock history, transactions).
- Product names are unique per store (case-insensitive) among active products. This is enforced in the app (`isProductNameTaken`), not by a DB constraint.
- `updateProduct` deletes only the variants listed in the form's `deletedVariantIds`. It never deletes variants just because they're missing from the submission.
- A store must always keep at least one active OWNER (checked in `updateUser`/`deleteUser`).
