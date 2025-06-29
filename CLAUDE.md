# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 cocktail recipe and ingredient database with cost calculation functionality. The application uses InstantDB for real-time data synchronization and supports both authenticated cloud storage and offline localStorage fallback.

## Commands

### Development
```bash
pnpm dev                # Start development server
pnpm build             # Build for production (includes type-check)
pnpm type-check        # TypeScript type checking only
pnpm preview           # Preview production build
```

### Testing & Quality
```bash
pnpm test:unit         # Run Vitest unit tests
pnpm lint              # Run both OxLint and ESLint with auto-fix
pnpm format            # Format code with Prettier
```

### Package Management
- This project uses **pnpm** (not npm/yarn)
- Always use `pnpm install` and `pnpm add` commands

### InstantDB Schema Updates
```bash
npx instant-cli@latest push schema    # Update database schema
npx instant-cli@latest push perms     # Update permissions
```

## Architecture

### Database Integration
- **InstantDB**: Primary database with real-time sync (`instant.schema.ts`, `instant.perms.ts`)
- **Hybrid Storage**: Cloud storage when authenticated, localStorage when offline
- **Magic Code Auth**: Email-based authentication flow

### State Management
- **Pinia Stores**: Located in `src/stores/`
  - `auth.ts`: Authentication state
  - `ingredients.ts`: Ingredient management
  - `recipes.ts`: Recipe management
- **Dual Store Pattern**: Most stores have both local and cloud variants

### Key Directories
- `src/components/`: Vue components (Auth*, *Dialog, *Form, Recipe*, Ingredient*)
- `src/composables/`: Reusable Vue 3 composition functions
- `src/stores/`: Pinia state management
- `src/views/`: Route-level components
- `src/utils/`: Utility functions

### Routes
- `/`: Recipe list (home)
- `/recipes/new`: Recipe creator
- `/ingredients`: Ingredients manager

### Data Models
- **Ingredients**: Single and compound ingredients with pricing
- **Recipes**: Cocktail recipes with cost calculations
- **Recipe Ingredients**: Many-to-many relationships
- **Users**: Authentication and data ownership

## Environment Setup

Required environment variables:
```bash
VITE_INSTANT_APP_ID=your-instant-app-id-here
```

Optional for deployment:
```bash
VITE_BASE_PATH=/cost-calculator/  # For GitHub Pages
```

## Tech Stack

- **Vue 3** with Composition API and `<script setup>`
- **TypeScript** throughout
- **Pinia** for state management
- **Vite** for build tooling
- **Vitest** for testing
- **InstantDB** for backend/database
- **OxLint + ESLint** for linting
- **Prettier** for formatting

## Development Notes

- Use `vue-tsc` for TypeScript checking in Vue files
- Authentication uses magic code email flow via InstantDB
- Data automatically syncs between local storage and cloud when user authenticates
- Excel import/export functionality available via `xlsx` library
- Hash-based routing used for better deployment compatibility