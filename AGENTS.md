# AGENTS.md

## Commands

```bash
npm run dev        # Start dev server on port 8080
npm run build      # Production build
npm run build:dev  # Build in development mode
npm run lint       # Run ESLint
npm run test       # Run Vitest tests (jsdom env)
npm run test:watch # Watch mode
```

## Setup

Create `.env` with Supabase credentials:
```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

## Architecture

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **State**: React Context + Reducer with LocalStorage persistence
- **PWA**: Enabled via vite-plugin-pwa (generates service worker)

## Testing

- Vitest with jsdom environment
- Setup file: `src/test/setup.ts`
- Run single test: `npm run test -- src/test/example.test.ts`

## Key Paths

- `@` alias maps to `src/`
- Components: `src/components/`
- Pages: `src/pages/`
- Contexts: `src/contexts/`
- Hooks: `src/hooks/`
- Lib utilities: `src/lib/`

## Linting

ESLint with TypeScript support. Key rules:
- React hooks rules enabled
- `react-refresh/only-export-components`: warn
- Unused vars checks disabled in tsconfig