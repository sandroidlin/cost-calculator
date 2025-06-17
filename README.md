# Cost Calculator - 酒譜資料庫

A Vue 3 application for managing cocktail recipes and ingredients with real-time synchronization powered by InstantDB.

## Features

- **Recipe Management**: Create, edit, and organize cocktail recipes
- **Ingredient Database**: Manage single and compound ingredients with pricing
- **Real-time Sync**: Data syncs across devices when authenticated
- **Magic Code Auth**: Simple email-based authentication
- **Offline Support**: Works offline with localStorage fallback
- **Cost Calculation**: Automatic cost calculation for recipes

## InstantDB Integration

This application uses [InstantDB](https://instantdb.com/) for real-time data synchronization and authentication. The integration includes:

- Magic code email authentication
- Real-time data sync across devices
- Offline-first approach with localStorage fallback
- Hybrid data stores supporting both local and cloud storage

### Environment Setup

Create a `.env` file based on `.env.example`:

```bash
# InstantDB Configuration
VITE_INSTANT_APP_ID=your-instant-app-id-here
```

For production deployment, set `VITE_INSTANT_APP_ID` as a GitHub Actions secret or environment variable.

### Database Schema

The application uses the following InstantDB schema:

- **ingredients**: Single and compound ingredients with pricing
- **recipes**: Cocktail recipes with methods and costs
- **compound_ingredients**: Relationships for compound ingredients
- **recipe_ingredients**: Recipe ingredient relationships
- **$users**: User authentication and data ownership

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## Authentication Flow

1. Users enter their email address
2. InstantDB sends a magic code to their email
3. Users enter the code to authenticate
4. Data syncs in real-time when authenticated
5. Works offline with localStorage when not authenticated

## Architecture

- **Vue 3**: Frontend framework with Composition API
- **Pinia**: State management for ingredients and recipes
- **InstantDB**: Real-time backend with authentication
- **TypeScript**: Type safety throughout the application
- **Vite**: Build tool and development server

## Deployment

The application is configured for GitHub Pages deployment. Set your InstantDB App ID as a GitHub secret named `VITE_INSTANT_APP_ID`.

## License

This project is open source and available under the [MIT License](LICENSE).
