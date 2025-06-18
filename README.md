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

The application uses the following InstantDB schema defined in `instant.schema.ts`:

- **ingredients**: Single and compound ingredients with pricing
- **recipes**: Cocktail recipes with methods and costs
- **compound_ingredients**: Relationships for compound ingredients
- **recipe_ingredients**: Recipe ingredient relationships
- **$users**: User authentication and data ownership

### Permissions

Database permissions are configured in `instant.perms.ts` using InstantDB's Rule Language:

- Users can only access their own ingredients and recipes
- Authentication is required for all operations
- Proper ownership validation ensures data security
- Users cannot directly create or delete user accounts

To update the schema or permissions in production:

```bash
# Use InstantDB CLI to push changes
npx instant-cli@latest push schema
npx instant-cli@latest push perms
```

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

The application supports flexible deployment to various platforms:

### Environment Variables

```bash
# Required: InstantDB Configuration
VITE_INSTANT_APP_ID=your-instant-app-id-here

# Optional: Base path for asset loading
# For GitHub Pages: Set to '/repository-name/'
# For Netlify/Vercel: Leave unset or set to '/'
VITE_BASE_PATH=/cost-calculator/
```

### GitHub Pages

For GitHub Pages deployment, set the following secrets in your repository:
- `VITE_INSTANT_APP_ID`: Your InstantDB App ID
- `VITE_BASE_PATH`: `/cost-calculator/` (or your repository name)

### Netlify/Vercel

For Netlify or Vercel deployment:
- Set `VITE_INSTANT_APP_ID` in the environment variables
- **Do not** set `VITE_BASE_PATH` (defaults to `/` for proper asset loading)

## License

This project is open source and available under the [MIT License](LICENSE).
