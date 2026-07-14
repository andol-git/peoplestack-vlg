# PeopleStack — Enterprise Workforce Management

React + Vite + TypeScript + Ant Design frontend for the PeopleStack facility management platform (Employees, Customers, Assignments, Users, Attendance), talking to a Spring Boot backend.

## Quick Start

```bash
npm install
npm run dev
```

Opens at **http://localhost:4400**. The dev server proxies `/vlg_service_v1/*` to the backend (see `vite.config.ts`), so there's no CORS setup needed locally.

## Project Structure

```
src/
  api/          → axios wrappers per resource (auth, employee, customer, user, attendance)
  hooks/        → TanStack Query hooks wrapping the api layer
  store/        → Zustand auth store (tokens, role, username)
  lib/http.ts   → axios instance + JWT request/response interceptors (refresh-and-retry)
  layout/       → ShellLayout (sidebar + topbar, role-based nav)
  pages/        → one folder per feature area
  routes.tsx    → route tree + auth guards
  constants/    → role labels/permissions, company list
  types/models.ts → shared TypeScript types matching the backend API shapes
```

## Config

Backend URL and white-label branding live in `src/config/app-config.ts`. The dev proxy target is in `vite.config.ts`.

## Roles

Role-based sidebar visibility (Super Admin / Admin / Manager / Supervisor / User) is defined in `src/constants/roles.ts`.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check + production build
- `npm run lint` — oxlint
- `npm run preview` — preview the production build locally
