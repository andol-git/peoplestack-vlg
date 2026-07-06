const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageBreak
} = require('docx');
const fs = require('fs');

// ─── Colors ───────────────────────────────────────────────
const C = {
  brand:      '4F46E5',
  brandLight: 'EEF2FF',
  dark:       '0F172A',
  muted:      '475569',
  subtle:     '94A3B8',
  border:     'E2E8F0',
  white:      'FFFFFF',
  green:      '10B981',
  amber:      'F59E0B',
  code:       'F1F5F9',
  codeBorder: 'CBD5E1',
};

// ─── Helpers ──────────────────────────────────────────────
const border = { style: BorderStyle.SINGLE, size: 1, color: C.border };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.brand, space: 6 } },
    children: [new TextRun({ text, font: 'Arial', size: 36, bold: true, color: C.dark })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, font: 'Arial', size: 28, bold: true, color: C.brand })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, font: 'Arial', size: 24, bold: true, color: C.dark })],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 80, line: 276 },
    children: [new TextRun({ text, font: 'Arial', size: 22, color: C.muted, ...opts })],
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { before: 40, after: 40, line: 276 },
    children: [new TextRun({ text, font: 'Arial', size: 22, color: C.muted })],
  });
}

function code(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    shading: { fill: C.code, type: ShadingType.CLEAR },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: C.brand, space: 8 } },
    indent: { left: 360, right: 360 },
    children: [new TextRun({ text, font: 'Courier New', size: 18, color: C.dark })],
  });
}

function note(text, color = C.brandLight, borderColor = C.brand) {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    shading: { fill: color, type: ShadingType.CLEAR },
    border: { left: { style: BorderStyle.SINGLE, size: 14, color: borderColor, space: 8 } },
    indent: { left: 360, right: 240 },
    children: [new TextRun({ text, font: 'Arial', size: 20, color: C.dark })],
  });
}

function spacer(before = 120, after = 120) {
  return new Paragraph({ spacing: { before, after }, children: [new TextRun('')] });
}

function headerRow(cells, colWidths) {
  return new TableRow({
    tableHeader: true,
    children: cells.map((text, i) =>
      new TableCell({
        borders,
        width: { size: colWidths[i], type: WidthType.DXA },
        shading: { fill: C.brand, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 160, right: 160 },
        children: [new Paragraph({
          children: [new TextRun({ text, font: 'Arial', size: 20, bold: true, color: C.white })],
        })],
      })
    ),
  });
}

function dataRow(cells, colWidths, shade = false) {
  return new TableRow({
    children: cells.map((text, i) =>
      new TableCell({
        borders,
        width: { size: colWidths[i], type: WidthType.DXA },
        shading: { fill: shade ? 'F8FAFC' : C.white, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 160, right: 160 },
        children: [new Paragraph({
          children: [new TextRun({ text: String(text), font: 'Arial', size: 20, color: C.muted })],
        })],
      })
    ),
  });
}

// ─── Cover Page ────────────────────────────────────────────
const coverPage = [
  spacer(1800, 0),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 120 },
    children: [
      new TextRun({ text: 'ENTERPRISE FACILITY', font: 'Arial', size: 64, bold: true, color: C.brand }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 480 },
    children: [
      new TextRun({ text: 'MANAGEMENT PLATFORM', font: 'Arial', size: 64, bold: true, color: C.dark }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 200 },
    children: [new TextRun({ text: 'Complete Developer Setup Guide & Architecture Reference', font: 'Arial', size: 28, color: C.muted })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 600 },
    children: [new TextRun({ text: 'NX Monorepo · Angular 19 · Tailwind CSS · Facade Pattern · JWT Auth', font: 'Arial', size: 22, color: C.subtle, italics: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.border, space: 6 } },
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text: 'Version 1.0  ·  April 2026  ·  VLG Services Pvt. Ltd.', font: 'Arial', size: 20, color: C.subtle })],
  }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ─── Document sections ──────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 540, hanging: 360 } } },
        }],
      },
      {
        reference: 'steps',
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 540, hanging: 360 } } },
        }],
      },
    ],
  },
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: 'Arial', color: C.dark },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: C.brand },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Arial', color: C.dark },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 } },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    children: [
      ...coverPage,

      // ── 1. OVERVIEW ─────────────────────────────────────
      h1('1. Platform Overview'),
      body('The Enterprise PeopleStack is a white-label, production-grade Angular 19 application built on an NX monorepo. It provides complete workforce lifecycle management for facility service companies — covering hiring, compliance, site management, and payroll documentation.'),
      spacer(),
      note('🏷️  White-Label Ready: All branding is controlled via a single AppConfig token. Rename, recolor, and redeploy for any new client in under 10 minutes.', C.brandLight, C.brand),
      spacer(),

      h2('1.1 Key Features'),
      bullet('Employee lifecycle — Add, Edit, View, Deactivate, Delete with full profile'),
      bullet('7-step guided wizard form matching the original paper-based onboarding'),
      bullet('JWT authentication with interceptors and route guards'),
      bullet('Facade design pattern — clean separation of UI from state/API logic'),
      bullet('Responsive sidebar layout with collapsible navigation'),
      bullet('Profile dropdown with logout in the topbar'),
      bullet('Toast notifications, skeleton loaders, delete confirmation modals'),
      bullet('Multi-step form with visual step progress indicator'),
      bullet('Compliance tracking: AEP, AVSEC, PF, ESIC, Passport, Aadhaar, PAN, Bank'),
      bullet('Paginated employee table with search, tabs (Active/Inactive), bulk select'),
      spacer(),

      h2('1.2 Technology Stack'),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2400, 2800, 4160],
        rows: [
          headerRow(['Layer', 'Technology', 'Purpose'], [2400, 2800, 4160]),
          dataRow(['Frontend Framework', 'Angular 19 (Standalone)', 'Component-based SPA'], [2400, 2800, 4160], false),
          dataRow(['Monorepo', 'NX 20', 'Workspace management, code sharing'], [2400, 2800, 4160], true),
          dataRow(['Styling', 'Tailwind CSS 3.4', 'Utility-first, white-label tokens'], [2400, 2800, 4160], false),
          dataRow(['State Management', 'Angular Signals + Facades', 'Reactive state without NgRx'], [2400, 2800, 4160], true),
          dataRow(['Authentication', 'JWT (Bearer Token)', 'Login / Logout / Guards'], [2400, 2800, 4160], false),
          dataRow(['HTTP Client', '@angular/common/http', 'Typed API calls + interceptors'], [2400, 2800, 4160], true),
          dataRow(['Fonts', 'Plus Jakarta Sans + Syne', 'Enterprise typography system'], [2400, 2800, 4160], false),
          dataRow(['Backend API', 'Spring Boot (port 8080)', 'REST API with MongoDB GridFS'], [2400, 2800, 4160], true),
        ],
      }),
      spacer(200, 0),
      new Paragraph({ children: [new PageBreak()] }),

      // ── 2. ARCHITECTURE ──────────────────────────────────
      h1('2. Architecture & Folder Structure'),
      body('The project follows NX monorepo conventions with a clear separation between the host application (apps/shell) and shared libraries (libs/).'),
      spacer(),

      h2('2.1 Directory Layout'),
      code('peopleStack/'),
      code('├── apps/'),
      code('│   └── shell/                     ← Main Angular application'),
      code('│       └── src/'),
      code('│           ├── app/'),
      code('│           │   ├── core/'),
      code('│           │   │   ├── guards/        auth.guard.ts'),
      code('│           │   │   └── interceptors/  jwt.interceptor.ts'),
      code('│           │   ├── layout/'),
      code('│           │   │   └── shell-layout/  sidebar + topbar'),
      code('│           │   └── features/'),
      code('│           │       ├── auth/          login page'),
      code('│           │       ├── dashboard/     home screen'),
      code('│           │       └── employees/     list + form + detail'),
      code('│           ├── environments/          env configs (white-label)'),
      code('│           └── styles.css             global theme + utilities'),
      code('├── libs/'),
      code('│   └── shared/'),
      code('│       ├── models/src/index.ts        TypeScript interfaces'),
      code('│       └── data-access/src/'),
      code('│           ├── lib/'),
      code('│           │   ├── auth-api.service.ts'),
      code('│           │   ├── employee-api.service.ts'),
      code('│           │   ├── token-storage.service.ts'),
      code('│           │   ├── auth.facade.ts     ← Facade pattern'),
      code('│           │   └── employee.facade.ts ← Facade pattern'),
      code('│           └── tokens/'),
      code('│               └── app-config.token.ts  ← White-label token'),
      code('├── angular.json'),
      code('├── nx.json'),
      code('├── tsconfig.base.json'),
      code('└── tailwind.config.js'),
      spacer(),

      h2('2.2 Facade Design Pattern'),
      body('Every feature uses a Facade service as the single point of contact between the UI component and the API + state layer. Components never call API services directly.'),
      spacer(),
      note('📐 Pattern: Component → Facade → API Service  |  Component reads from Signals exposed by Facade', C.brandLight, C.brand),
      spacer(),
      code('// EmployeeFacade exposes signals'),
      code('readonly employees     = computed(() => this._state().employees);'),
      code('readonly isLoading     = computed(() => this._state().isLoading);'),
      code('readonly successMessage = computed(() => this._state().successMessage);'),
      spacer(),
      code('// Component injects only the facade'),
      code('readonly facade = inject(EmployeeFacade);'),
      code(''),
      code('// Component calls facade actions'),
      code('facade.loadEmployees(true);'),
      code('facade.createEmployee(payload).subscribe(() => router.navigate(...));'),
      spacer(200, 0),
      new Paragraph({ children: [new PageBreak()] }),

      // ── 3. SETUP ─────────────────────────────────────────
      h1('3. Step-by-Step Setup Commands'),
      note('⚠️  Prerequisites: Node.js 18+, npm 9+. Run all commands from your terminal in the project root.', 'FEF3C7', C.amber),
      spacer(),

      h2('Step 1 — Install NX CLI & Angular CLI'),
      code('npm install -g nx@latest @angular/cli@latest'),
      spacer(),

      h2('Step 2 — Create NX Workspace'),
      code('npx create-nx-workspace@latest peopleStack \\'),
      code('  --preset=angular-monorepo \\'),
      code('  --appName=shell \\'),
      code('  --style=css \\'),
      code('  --nxCloud=skip \\'),
      code('  --routing=true \\'),
      code('  --bundler=esbuild \\'),
      code('  --ssr=false'),
      code(''),
      code('cd peopleStack'),
      spacer(),

      h2('Step 3 — Install Dependencies'),
      code('npm install jwt-decode'),
      code('npm install -D tailwindcss@latest postcss autoprefixer'),
      code('npx tailwindcss init -p'),
      spacer(),

      h2('Step 4 — Copy Source Files'),
      body('Copy all files from this guide\'s code package into the matching paths. The key files to place are:'),
      bullet('apps/shell/src/styles.css  — global theme with CSS variable tokens'),
      bullet('apps/shell/src/app/app.config.ts  — providers, router, interceptors'),
      bullet('apps/shell/src/app/app.routes.ts  — all lazy-loaded routes'),
      bullet('apps/shell/src/environments/environment.ts  — white-label config'),
      bullet('libs/shared/models/src/index.ts  — all TypeScript interfaces'),
      bullet('libs/shared/data-access/src/  — all API services and facades'),
      bullet('All feature components under apps/shell/src/app/features/'),
      spacer(),

      h2('Step 5 — Configure Tailwind'),
      body('Replace the generated tailwind.config.js with the provided version which includes CSS variable-based brand tokens, custom fonts, and keyframe animations.'),
      spacer(),

      h2('Step 6 — Configure Path Aliases'),
      body('Ensure tsconfig.base.json has the following paths configured:'),
      code('"paths": {'),
      code('  "@ps/shared/models":       ["libs/shared/models/src/index.ts"],'),
      code('  "@ps/shared/data-access":  ["libs/shared/data-access/src/index.ts"]'),
      code('}'),
      spacer(),

      h2('Step 7 — Run the Application'),
      code('nx serve shell'),
      body('The app will be available at http://localhost:4200'),
      spacer(200, 0),
      new Paragraph({ children: [new PageBreak()] }),

      // ── 4. WHITE-LABEL ───────────────────────────────────
      h1('4. White-Label Guide'),
      body('Every aspect of the platform\'s branding is controlled through a single configuration object injected via Angular\'s dependency injection system. To deploy for a new client, you only need to change the AppConfig values.'),
      spacer(),

      h2('4.1 AppConfig Object'),
      code('// apps/shell/src/environments/environment.ts'),
      code('export const APP_CONFIG_VALUE: AppConfig = {'),
      code('  appName:      "Client PeopleStack",'),
      code('  appShortName: "CFM",'),
      code('  logoUrl:      "/assets/client-logo.svg",'),
      code('  primaryColor: "#6366f1",         // change brand color'),
      code('  apiBaseUrl:   "https://api.clientdomain.com",'),
      code('  supportEmail: "support@clientdomain.com",'),
      code('  companyName:  "Client Company Pvt. Ltd.",'),
      code('};'),
      spacer(),

      h2('4.2 CSS Variable Theming'),
      body('Override the CSS custom properties in styles.css to change the entire color palette for a client:'),
      code(':root {'),
      code('  --brand-500: #6366f1;    /* primary brand color */'),
      code('  --brand-600: #4f46e5;    /* darker shade for hover */'),
      code('  --sidebar-bg: #0f172a;   /* sidebar background */'),
      code('}'),
      spacer(),

      h2('4.3 Multi-Client Deployments'),
      body('For serving multiple clients from the same codebase, create environment files per client:'),
      bullet('environment.vlg.ts   — VLG Services config'),
      bullet('environment.bial.ts  — BIAL Airport config'),
      bullet('environment.gmr.ts   — GMR Group config'),
      body('Then configure angular.json fileReplacements to swap them at build time per deployment target.'),
      spacer(200, 0),
      new Paragraph({ children: [new PageBreak()] }),

      // ── 5. API CONTRACT ──────────────────────────────────
      h1('5. API Integration Reference'),
      body('All API communication is handled through the service layer in libs/shared/data-access. The JWT interceptor automatically attaches the Bearer token to every request except the login endpoint.'),
      spacer(),

      h2('5.1 Authentication Flow'),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1800, 1400, 1600, 4560],
        rows: [
          headerRow(['Method', 'Endpoint', 'Auth Required', 'Description'], [1800, 1400, 1600, 4560]),
          dataRow(['POST', '/api/auth/login', 'No', 'Returns accessToken + refreshToken'], [1800, 1400, 1600, 4560], false),
          dataRow(['POST', '/api/auth/logout', 'Yes', 'Revokes current JWT token'], [1800, 1400, 1600, 4560], true),
        ],
      }),
      spacer(),

      h2('5.2 Employee Endpoints'),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1600, 2600, 1600, 3560],
        rows: [
          headerRow(['Method', 'Endpoint', 'Response', 'Description'], [1600, 2600, 1600, 3560]),
          dataRow(['GET',    '/api/employees',          '200 Array',     'All active employees'],          [1600, 2600, 1600, 3560], false),
          dataRow(['GET',    '/api/employees/inactive', '200 Array',     'All inactive employees'],        [1600, 2600, 1600, 3560], true),
          dataRow(['GET',    '/api/employees/{id}',     '200 Object',    'Single employee by DB id'],      [1600, 2600, 1600, 3560], false),
          dataRow(['POST',   '/api/employees',          '200 Object',    'Create new employee'],           [1600, 2600, 1600, 3560], true),
          dataRow(['PUT',    '/api/employees/{id}',     '200 Object',    'Full update of employee'],       [1600, 2600, 1600, 3560], false),
          dataRow(['PATCH',  '/api/employees/{id}/status', '204 Empty', 'Inactivate employee'],          [1600, 2600, 1600, 3560], true),
          dataRow(['DELETE', '/api/employees/{id}',     '204 Empty',     'Permanently delete employee'],  [1600, 2600, 1600, 3560], false),
          dataRow(['POST',   '/api/files/upload',       '200 String',    'Upload file to GridFS'],         [1600, 2600, 1600, 3560], true),
          dataRow(['GET',    '/api/files/{id}',         '200 Binary',    'Download file from GridFS'],     [1600, 2600, 1600, 3560], false),
        ],
      }),
      spacer(200, 0),
      new Paragraph({ children: [new PageBreak()] }),

      // ── 6. COMPONENT GUIDE ──────────────────────────────
      h1('6. Component Reference'),

      h2('6.1 Login Page  (/login)'),
      body('A full-screen split layout: left side shows the brand/hero section with feature pills, right side has the login card with animated glassmorphism styling. Uses Angular Reactive Forms with inline validation.'),
      bullet('Component: apps/shell/src/app/features/auth/login/login.component.ts'),
      bullet('Injects: AuthFacade, APP_CONFIG'),
      bullet('Signals: showPassword, error/loading from AuthFacade'),
      spacer(),

      h2('6.2 Shell Layout  (layout/shell-layout)'),
      body('Persistent frame that wraps all authenticated pages. Contains the collapsible sidebar and the topbar with search, notifications, and profile dropdown.'),
      bullet('Sidebar: collapsible with icon-only mode at 64px and full label mode at 240px'),
      bullet('Profile dropdown: click-away-to-close via HostListener on document:click'),
      bullet('Logout: calls AuthFacade.logout() which clears tokens and redirects to /login'),
      spacer(),

      h2('6.3 Employee List  (/employees)'),
      body('Full-featured data table with tabs for Active/Inactive employees, search, pagination (10/page), per-row action buttons (View, Edit, Deactivate, Delete), and a confirmation modal for delete.'),
      bullet('Component: employee-list.component.ts'),
      bullet('Uses computed() signals for filtered + paginated result sets'),
      bullet('Skeleton loader shown while facade.isLoading() is true'),
      spacer(),

      h2('6.4 Employee Form  (/employees/new  or  /employees/:id/edit)'),
      body('A 7-step wizard that mirrors the original paper onboarding form from VLG. Each step has its own section of the reactive form. The progress bar and step indicators update as the user navigates.'),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1000, 2400, 5960],
        rows: [
          headerRow(['Step', 'Name', 'Fields Covered'], [1000, 2400, 5960]),
          dataRow(['1', 'Basic Info',   'ID No, Serial No, Phone, Email, Name, DOB, Gender, Blood Group, Marital Status, Height/Weight/Chest, Identification Marks'], [1000, 2400, 5960], false),
          dataRow(['2', 'Family',       'Father\'s name/age/occupation, Mother\'s name, Wife\'s name, Alt mobile, Relation, Father\'s birthplace'], [1000, 2400, 5960], true),
          dataRow(['3', 'Career',       'Joining date, Interview date, Re-joining, Designation, Organisation, Nature of employment, School details, Present address'], [1000, 2400, 5960], false),
          dataRow(['4', 'Address',      'Permanent address (line1, district, state, pincode), Temporary/Current address'], [1000, 2400, 5960], true),
          dataRow(['5', 'Legal',        '9 yes/no questions on legal background, responsible persons info'], [1000, 2400, 5960], false),
          dataRow(['6', 'Compliance',   'Aadhaar, PAN, Bank, IFSC, PF, ESIC, Passport, AEP, AVSEC details with status dropdowns'], [1000, 2400, 5960], true),
          dataRow(['7', 'Work Details', 'Site, Shift, Category, Uniform, Shoes, Certificates, Documents, Broker, Transport, Leave, Exit details'], [1000, 2400, 5960], false),
        ],
      }),
      spacer(200, 0),
      new Paragraph({ children: [new PageBreak()] }),

      // ── 7. FUTURE ROADMAP ────────────────────────────────
      h1('7. Future Roadmap'),
      body('The platform is designed to be extended. The following features can be added for future client versions:'),
      spacer(),

      h2('Phase 2 — Compliance Module'),
      bullet('AEP expiry alerts — notify 30/60 days before expiry'),
      bullet('AVSEC renewal tracking with automated email reminders'),
      bullet('Bulk document upload with progress tracker'),
      bullet('Document viewer for uploaded Aadhaar/PAN scans'),
      spacer(),

      h2('Phase 3 — Operations Module'),
      bullet('Shift roster management — drag-and-drop schedule builder'),
      bullet('Site-based employee filtering and assignment'),
      bullet('Leave management — request, approve, reject flows'),
      bullet('Attendance tracking integration'),
      spacer(),

      h2('Phase 4 — Analytics & Reporting'),
      bullet('Dashboard charts — headcount trends, compliance rates, attrition'),
      bullet('PDF report generation for employee profiles'),
      bullet('Excel export for payroll and compliance data'),
      bullet('Role-based access control — Admin, HR, Site Manager, Viewer'),
      spacer(),

      h2('Phase 5 — Mobile'),
      bullet('Angular PWA configuration for offline support'),
      bullet('Capacitor wrapper for native iOS/Android app'),
      bullet('Biometric login support'),
      spacer(200, 0),

      // ── 8. TROUBLESHOOTING ───────────────────────────────
      h1('8. Troubleshooting'),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3600, 5760],
        rows: [
          headerRow(['Issue', 'Solution'], [3600, 5760]),
          dataRow(['Path alias @ps/shared/models not found', 'Ensure tsconfig.base.json paths are correct and the lib src/index.ts exports all models'], [3600, 5760], false),
          dataRow(['API calls fail with 403', 'Check JWT token is stored correctly; verify jwtInterceptor is in app.config providers'], [3600, 5760], true),
          dataRow(['Tailwind classes not applying', 'Verify tailwind.config.js content paths include apps/**/*.{html,ts} and libs/**/*.{html,ts}'], [3600, 5760], false),
          dataRow(['CORS errors from backend', 'Configure Spring Boot to allow http://localhost:4200 in CORS settings'], [3600, 5760], true),
          dataRow(['NX cannot find library', 'Run nx reset to clear NX cache, then nx serve shell again'], [3600, 5760], false),
          dataRow(['Signals not updating view', 'Ensure component uses computed() for derived state and reads signal with () call'], [3600, 5760], true),
        ],
      }),
      spacer(),
      note('📧  For support contact: support@vlgservices.com  |  This document is confidential and intended for authorized developers only.', 'F8FAFC', C.subtle),
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync('/home/claude/peopleStack/FMP_Setup_Guide.docx', buffer);
  console.log('Done: FMP_Setup_Guide.docx');
});
