# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OGY Dashboard is a React 18 + TypeScript + Vite application serving as the analytics and governance dashboard for the ORIGYN SNS token ecosystem on the Internet Computer blockchain. It provides token metrics, governance participation, proposals, transactions, and NFT collection indexing.

## Build Commands

```bash
npm run dev                  # Development server (localhost:5173)
npm run dev:preprod          # Dev server with preprod config
npm run build:staging        # Lint + type check + build for staging
npm run build:preprod        # Build for preprod
npm run build:production     # Build for production
npm run lint                 # ESLint on src/**/*.tsx
npm run format               # Prettier formatting
npm run deploy:staging       # Build and deploy to IC staging
npm run deploy:preprod       # Build and deploy to IC preprod
```

## Architecture

### Directory Structure

```
src/
├── pages/          # Route components (one per route)
├── components/     # Reusable UI components
│   └── ui/         # Base primitives (Button, Input, Dialog, Table)
├── hooks/          # Custom React hooks wrapping queries/logic
├── services/       # API communication layer
│   ├── api/        # Axios REST clients (icrc, sns, ogy, ledger, rosetta)
│   ├── queries/    # React Query functions
│   ├── types/      # TypeScript interfaces
│   └── candid/     # IDL factories for IC canisters
├── helpers/        # Utility functions (numbers, dates, charts)
├── constants/      # Environment variables
├── providers/      # Context providers
└── types/          # Global TypeScript types
```

### State Management

- **Server state**: React Query (@tanstack/react-query) for caching and synchronization
- **Wallet state**: @amerej/artemis-react for IC wallet integration
- **Local state**: React Context for page-level UI state (in `pages/*/context.tsx`)
- **Form state**: react-hook-form and @tanstack/react-form

### Data Fetching

Two patterns for IC communication:
1. **REST APIs** via Axios clients in `services/api/` (icrc/v1, sns/v1, ogy, ledger, rosetta)
2. **Direct canister calls** via `getActor()` from artemis-react with IDL factories in `services/candid/`

Custom hooks in `hooks/` wrap React Query and transform responses for components.

### Path Aliases

Configured in tsconfig.json:
- `@hooks/*`, `@pages/*`, `@components/*`, `@services/*`, `@helpers/*`, `@providers/*`, `@constants/*`, `@theme/*`

### Authentication

Wallet-based via @amerej/artemis-react. Protected routes check `localStorage.getItem("dfinityWallet")`. Principal-based access for canister operations.

## Environment Configuration

Environment files: `.env.dev`, `.env.staging`, `.env.preprod`, `.env.production`

Key variables:
- `VITE_SNS_LEDGER_CANISTER_ID`, `VITE_SNS_GOVERNANCE_CANISTER_ID`
- `VITE_TOKEN_METRICS_CANISTER_ID`, `VITE_OGY_TOKEN_SWAP_CANISTER_ID`
- `VITE_SNS_REWARDS_CANISTER_ID`
- `VITE_API_ICRC_V1_BASE_URL`, `VITE_API_OGY_BASE_URL`, `VITE_API_SNS_BASE_URL`

## Key Libraries

- **UI**: TailwindCSS, @headlessui/react, @heroicons/react, @mui/material
- **Charts**: recharts
- **Tables**: @tanstack/react-table
- **Dates**: luxon
- **Numbers**: millify (formatting 1M, 1K)
- **IC**: @dfinity/agent, @dfinity/candid, @dfinity/principal, @dfinity/ledger-icp, @dfinity/ledger-icrc

## NFT Collection Standards

The dashboard supports two NFT standards for collection indexing:

### ICRC-7 (New Standard)
- Used by GLD NFT collections (1g, 10g, 100g, 1kg)
- IDL factory: `src/services/candid/icrc7_nft.js`
- Methods: `icrc7_name()`, `icrc7_symbol()`, `icrc7_logo()`, `icrc7_total_supply()`
- Collection links go to IC Dashboard: `https://dashboard.internetcomputer.org/canister/{id}`

### ORIGYN (Legacy Standard)
- Used by older collections (Art, Certification, Jewelry, some Precious Metals)
- IDL factory: `src/services/candid/origyn_nft_reference.js`
- Method: `collection_nft_origyn([])`
- Collection links go to canister HTTP endpoint: `https://{id}.raw.icp0.io/collection/info`

### How Standard Detection Works

Instead of runtime detection, legacy ORIGYN collection IDs are hardcoded in `src/constants/index.ts`:

```typescript
export const LEGACY_ORIGYN_COLLECTION_IDS = new Set([...]);
export const isLegacyOrigynCollection = (canisterId: string): boolean => {
  return LEGACY_ORIGYN_COLLECTION_IDS.has(canisterId);
};
```

The `CollectionContainer` component checks this list to determine which IDL factory and methods to use:
- If canisterId is in the legacy set → use ORIGYN standard
- Otherwise → use ICRC-7 standard (default)

### Adding New Collections

- **ICRC-7 collections**: No changes needed, they work by default
- **ORIGYN collections**: Add the canister ID to `LEGACY_ORIGYN_COLLECTION_IDS` in `src/constants/index.ts`

### Key Files

- `src/components/certificates/CollectionContainer.tsx` - Fetches collection data using appropriate standard
- `src/components/certificates/CollectionCard.tsx` - Displays collection with correct link URL
- `src/constants/index.ts` - Contains `LEGACY_ORIGYN_COLLECTION_IDS` set and helper function
- `src/services/candid/icrc7_nft.js` - ICRC-7 IDL factory
- `src/services/candid/origyn_nft_reference.js` - ORIGYN IDL factory
