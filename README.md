# Pikawise

**Discover Meals. Plan Better. Cook Smarter.**

A progressive web app (PWA) for discovering meals, building balanced meal plans, and managing shopping lists — works offline.

## Features

- **Meal Discovery** — Browse thousands of recipes from TheMealDB by category, cuisine, or ingredient
- **Random Meal** — Can't decide? Get a surprise recipe
- **Balanced Diet Builder** — Create meal plans based on your dietary preferences and ingredients you have
- **Meal Plans** — Save and manage weekly meal plans locally
- **Shopping List** — Auto-generated grocery lists from your meal plans
- **Favorites** — Save recipes you love (stored locally, works offline)
- **Dark Mode** — Light, dark, and system theme support
- **Installable** — Add to your home screen for a native app experience
- **Offline Ready** — Core features work without an internet connection

## Tech Stack

- React 18 + React Router 6
- Vite 5
- CSS Custom Properties (no Tailwind)
- TheMealDB API
- vite-plugin-pwa (Service Worker + manifest)

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
  components/    # Reusable UI components
  pages/         # Route-level page components
  hooks/         # Custom React hooks
  utils/         # Utility functions
  services/      # API service layer (TheMealDB)
  styles/        # CSS files (variables, base, components, etc.)
  assets/        # Static assets (logo, hero image)
  config/        # App configuration
public/
  icons/         # PWA icons
```

## License

Built by Alpha Odiero
