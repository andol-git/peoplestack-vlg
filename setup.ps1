# ═══════════════════════════════════════════════════════════════
#  PeopleStack — Auto Setup Script (PowerShell for Windows)
#  Run this script ONCE after extracting the ZIP
#  Usage: Right-click → "Run with PowerShell"
#         OR in terminal: .\setup.ps1
# ═══════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "╔═══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   PeopleStack — Auto Setup Script     ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Check Node ──────────────────────────────────────
Write-Host "▶ Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  ✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node.js not found! Please install from https://nodejs.org (LTS)" -ForegroundColor Red
    exit 1
}

# ── Step 2: Install global tools ───────────────────────────
Write-Host ""
Write-Host "▶ Installing NX CLI and Angular CLI globally..." -ForegroundColor Yellow
npm install -g nx@latest @angular/cli@latest
Write-Host "  ✓ Global tools installed" -ForegroundColor Green

# ── Step 3: Create NX workspace ────────────────────────────
Write-Host ""
Write-Host "▶ Creating NX workspace 'peopleStack'..." -ForegroundColor Yellow
npx create-nx-workspace@latest peopleStack `
  --preset=angular-monorepo `
  --appName=shell `
  --style=css `
  --nxCloud=skip `
  --routing=true `
  --bundler=esbuild `
  --ssr=false
Write-Host "  ✓ Workspace created" -ForegroundColor Green

# ── Step 4: Enter workspace ─────────────────────────────────
Set-Location peopleStack

# ── Step 5: Install dependencies ────────────────────────────
Write-Host ""
Write-Host "▶ Installing project dependencies..." -ForegroundColor Yellow
npm install jwt-decode
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
Write-Host "  ✓ Dependencies installed" -ForegroundColor Green

# ── Step 6: Copy our source files ───────────────────────────
Write-Host ""
Write-Host "▶ Copying PeopleStack source files..." -ForegroundColor Yellow

$source = Split-Path -Parent $PSScriptRoot

# Root config files
Copy-Item "$source\tailwind.config.js" -Destination "." -Force
Copy-Item "$source\tsconfig.base.json" -Destination "." -Force
Copy-Item "$source\angular.json"       -Destination "." -Force
Copy-Item "$source\nx.json"            -Destination "." -Force

# App files
$appDest = "apps\shell\src"
Copy-Item "$source\apps\shell\src\main.ts"    -Destination "$appDest\main.ts"    -Force
Copy-Item "$source\apps\shell\src\index.html" -Destination "$appDest\index.html" -Force
Copy-Item "$source\apps\shell\src\styles.css" -Destination "$appDest\styles.css" -Force

# App folder (components, routes, config)
if (Test-Path "$appDest\app") { Remove-Item "$appDest\app" -Recurse -Force }
Copy-Item "$source\apps\shell\src\app" -Destination "$appDest\app" -Recurse -Force

# Environments
Copy-Item "$source\apps\shell\src\environments" -Destination "$appDest\environments" -Recurse -Force

# tsconfig files
Copy-Item "$source\apps\shell\tsconfig.json"     -Destination "apps\shell\tsconfig.json"     -Force
Copy-Item "$source\apps\shell\tsconfig.app.json" -Destination "apps\shell\tsconfig.app.json" -Force

# Libs folder
if (Test-Path "libs") { Remove-Item "libs" -Recurse -Force }
Copy-Item "$source\libs" -Destination "libs" -Recurse -Force

Write-Host "  ✓ Source files copied" -ForegroundColor Green

# ── Step 7: Done! ────────────────────────────────────────────
Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✓ PeopleStack setup complete!                    ║" -ForegroundColor Green
Write-Host "║                                                   ║" -ForegroundColor Green
Write-Host "║  Make sure your Spring Boot backend is running    ║" -ForegroundColor Green
Write-Host "║  on http://localhost:8080, then run:              ║" -ForegroundColor Green
Write-Host "║                                                   ║" -ForegroundColor Green
Write-Host "║     nx serve shell                                ║" -ForegroundColor Green
Write-Host "║                                                   ║" -ForegroundColor Green
Write-Host "║  Open browser → http://localhost:4200             ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
