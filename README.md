# Zayka — Restaurant SaaS Platform (Monorepo)

Turborepo-powered monorepo for the Zayka restaurant platform.

## Structure

```
zayka-monorepo/
├── apps/
│   ├── app          → Customer ordering app (Next.js, port 3000)
│   └── rims         → Restaurant Inventory Management System (Next.js, port 3001)
├── packages/
│   ├── ui           → Shared UI components (@zayka/ui)
│   ├── config       → Shared ESLint, Tailwind, TypeScript configs (@zayka/config)
│   ├── utils        → Shared utility functions (@zayka/utils)
│   ├── auth         → Supabase auth helpers & clients (@zayka/auth)
│   └── types        → Shared TypeScript types (@zayka/types)
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Run all apps in dev mode
pnpm dev

# Run a specific app
pnpm dev:app    # Customer app on port 3000
pnpm dev:rims   # RIMS on port 3001

# Build all apps
pnpm build

# Build a specific app
pnpm build:app
pnpm build:rims

# Lint all packages
pnpm lint
```

## Importing Shared Packages

Apps can import shared packages using the `@zayka/` scope:

```tsx
// UI components
import { Button, Card, Input } from "@zayka/ui"

// Supabase auth client
import { supabaseClient, createServerClient } from "@zayka/auth"

// Utilities
import { cn, formatCurrency, formatOrderDate } from "@zayka/utils"

// Types
import type { MenuItem, Order, InventoryItem } from "@zayka/types"
```

## Environment Variables

Create a `.env.local` in each app directory (`apps/app/`, `apps/rims/`) with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=your_api_url
NEXT_PUBLIC_S3_BUCKET_URL=your_bucket_url
```

## Tech Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Framework**: Next.js 14
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Redux Toolkit (RTK Query)
- **Auth/DB**: Supabase
- **Language**: TypeScript
