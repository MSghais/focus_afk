# Focus AFK Web App

A modern productivity and focus application built with Next.js, React, and TypeScript. This document provides an overview for LLMs and developers to understand the app's features, stack, and architecture.

---

## 🚀 Features

- **Task Management**: Create, edit, delete, prioritize, categorize, and track tasks with time estimates and completion status.
- **Goal Tracking**: Set long-term goals, visualize progress, link goals to tasks, and track deadlines.
- **Focus Timer**: Customizable Pomodoro timer, break timer, session tracking, and browser notifications.
- **Dashboard**: Overview of productivity stats, recent activity, and quick actions.
- **Settings**: Timer preferences, notification settings, theme (light/dark/auto), and data management.
- **Offline-First**: All data is stored locally in the browser (IndexedDB via Dexie.js).

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **State Management**: Zustand
- **Database**: Dexie.js (IndexedDB)
- **Styling**: Tailwind CSS, CSS Modules, SCSS, CSS variables
- **Authentication**: Privy
- **UI**: Custom components, atomic design, responsive layout

---

## 🏗️ Architecture & Structure

- **Monorepo**: Shared packages in `packages/`, main app in `apps/web/`
- **Modules**: Feature modules in `components/modules/` (tasks, goals, timer, dashboard, settings, etc.)
- **UI Primitives**: Atomic elements in `components/small/` and layout/navigation in `components/ui/`
- **State**: Centralized in `store/` using Zustand
- **Database**: Configured in `lib/database.ts`, schema in README
- **Styling**: Global styles in `styles/`, theme variables in `index.scss` and `globals.css`, component styles via CSS Modules
- **Providers**: App-wide context/providers in `providers/`

---

## 🎨 Theming & Dark Mode

- **CSS Variables**: Theme colors and layout variables defined in `styles/index.scss` and `app/globals.css`
- **Dark Mode**: Toggled via a `data-theme` attribute on `<body>`, managed by `components/ui/ToggleTheme.tsx` (uses localStorage for persistence)
- **Tailwind**: Used for utility classes, with custom config in `@repo/tailwind-config`

---

## 🧩 Key Files & Folders

- `components/modules/` – Feature modules (dashboard, tasks, goals, timer, etc.)
- `components/ui/` – Layout/navigation and theme toggle
- `components/small/` – Atomic UI elements (Card, Gradient, Modal, Toast, etc.)
- `lib/database.ts` – Dexie.js IndexedDB setup
- `store/` – Zustand state management
- `styles/` – Global, variables, and component styles
- `providers/` – App-wide context and state providers

---

## ⚙️ How It Works

- **State**: All app state (tasks, goals, timer, settings, UI) is managed by Zustand and persisted in IndexedDB.
- **UI**: Modular, atomic design. Each feature is a module, composed in the main layout.
- **Theming**: Theme is set via a toggle, stored in localStorage, and applied using CSS variables and Tailwind classes.
- **Offline**: All data is local; no backend required for core features.
- **Authentication**: Privy is used for optional user authentication.

---

## 📝 Example: Dashboard Module

- Located at `components/modules/dashboard/index.tsx`
- Fetches stats from Zustand store (tasks, goals, timer sessions)
- Displays productivity metrics, recent activity, and quick actions
- Uses CSS Modules for styling and responsive layout

---

## 🧠 For LLMs & Developers

- Use semantic search and code navigation to explore modules and UI components.
- Styling is a mix of Tailwind, CSS Modules, and CSS variables for theme.
- All state logic is in Zustand (`store/`).
- Data is persisted in IndexedDB via Dexie.js (`lib/database.ts`).
- Theming is handled by toggling `data-theme` on `<body>` and using CSS variables.
- For new features, follow atomic design and modular structure.

---

For more details, see the full README.md or explore the codebase using Cursor's navigation tools. 