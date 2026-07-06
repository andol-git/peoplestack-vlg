# Enterprise PeopleStack — Setup Guide

## Architecture Overview

```
peopleStack/              ← NX Monorepo Root
├── apps/
│   └── shell/                        ← Main Angular App (host)
│       └── src/
│           ├── app/
│           │   ├── core/             ← Guards, Interceptors, Services
│           │   ├── layout/           ← Shell layout (sidebar, topbar)
│           │   ├── features/
│           │   │   ├── auth/         ← Login page
│           │   │   └── employees/    ← Employee CRUD
│           │   └── app.routes.ts
│           └── environments/
├── libs/
│   ├── shared/
│   │   ├── ui/                       ← Reusable UI components
│   │   ├── data-access/              ← API services + facades
│   │   └── models/                   ← TypeScript interfaces
│   └── theme/                        ← White-label theming
├── nx.json
├── package.json
└── tailwind.config.js
```

## White-Label Ready
- All branding is in `libs/theme/` and `environments/`
- Change `APP_CONFIG` to rebrand for any new client
- Token-based color system via CSS variables

## Step-by-Step Commands

### 1. Install NX CLI globally
```bash
npm install -g nx@latest @angular/cli@latest
```

### 2. Create NX Workspace
```bash
npx create-nx-workspace@latest peopleStack \
  --preset=angular-monorepo \
  --appName=shell \
  --style=css \
  --nxCloud=skip \
  --routing=true \
  --bundler=esbuild \
  --ssr=false
cd peopleStack
```

### 3. Install Dependencies
```bash
npm install -D tailwindcss@latest postcss autoprefixer
npm install @angular/cdk lucide-angular
npm install jwt-decode
npx tailwindcss init -p
```

### 4. Generate Libraries
```bash
# Shared models
nx g @nx/angular:library shared-models --directory=libs/shared/models --standalone --no-module

# Data access (API + Facades)  
nx g @nx/angular:library data-access --directory=libs/shared/data-access --standalone --no-module

# Shared UI components
nx g @nx/angular:library ui --directory=libs/shared/ui --standalone --no-module

# Theme library
nx g @nx/angular:library theme --directory=libs/theme --standalone --no-module
```

### 5. Copy all source files from this guide into the proper paths

### 6. Run
```bash
nx serve shell
```

---

All source files follow below in individual file sections.
