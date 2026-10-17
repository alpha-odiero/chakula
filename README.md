# Pikawise

**Discover Meals. Plan Better. Cook Smarter.**

A progressive web app (PWA) for discovering meals, building balanced meal plans, and managing shopping lists — works offline.

## Features

- **Meal Discovery** — Browse thousands of recipes by category, cuisine, or ingredient
- **Random Meal** — Can't decide? Get a surprise recipe
- **Balanced Diet Builder** — Create meal plans based on your dietary preferences and ingredients you have
- **Meal Plans** — Save and manage weekly meal plans locally
- **Shopping List** — Auto-generated grocery lists from your meal plans
- **Favorites** — Save recipes you love (stored locally, works offline)
- **Meal Reminders** — Optional, personalised prompts for breakfast, lunch, dinner, and snacks
- **Dark Mode** — Light, dark, and system theme support
- **Installable** — Add to your home screen for a native app experience
- **Offline Ready** — Core features work without an internet connection
- **Seamless Updates** — Browser tabs update silently; installed apps prompt when ready

## Tech Stack

- React 18 + React Router 6
- Vite 5
- CSS Custom Properties (no Tailwind)
- Recipe data provider adapter (`src/services/mealdb.js`)
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
  services/      # Provider adapter + internal meal model, notifications, reminders
  styles/        # CSS files (variables, base, components, etc.)
  assets/        # Static assets (logo, hero image)
  config/        # App configuration
public/
  icons/         # PWA icons
  sw-notifications.js  # Service-worker notification + periodic sync handlers
```

## Meal data model

All recipe data is normalised into an internal Pikawise model (`src/services/meals.js`)
before it reaches the UI, so no provider-specific field names, links, or response
shapes appear in the interface:

```js
Meal       { id, name, category, area, image, instructions, tags, youtube, source, ingredients }
Ingredient { name, measure }
Category   { name, image, description }
```

The provider adapter in `src/services/mealdb.js` is the only place that knows the
external API. Swapping providers means changing that one file.

## Reminders & notifications

Reminders are stored on-device under `chakula_reminders` and scheduled in the
user's time zone with quiet hours and per-weekday control. Delivery works in two
layers:

1. **In-app scheduler** — runs whenever a Pikawise tab or the installed app is
   open. Reliable, and the source of the in-app notification centre history.
2. **OS notifications** — sent through the service worker
   (`public/sw-notifications.js`) once the user grants permission.

### Background delivery limitation

When the app is fully closed, Pikawise falls back to **Periodic Background Sync**
(`periodicsync` in `sw-notifications.js`). This is **best-effort and not
guaranteed**: it is only available in some Chromium-based browsers, and the
browser decides when (and whether) to run it.

Guaranteed delivery while the app is closed requires a push backend:

- a scheduler that computes due reminders,
- a push service that stores subscriptions and sends Web Push messages
  (with **VAPID** keys),
- the client already handles `push` and `notificationclick` in
  `sw-notifications.js`, so wiring this up needs the server side only.

No server is included in this project, so background reminders outside an open
app are explicitly best-effort.

## License

Built by Alpha Odiero
