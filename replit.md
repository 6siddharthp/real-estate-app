# ABC Real Estate Customer Portal

## Overview

A multi-tenant real estate lease management portal that enables tenants to view their contracts, bills, documents, and notifications while allowing relationship managers and admins to manage customers and service requests. The application supports three user personas (Customer, Relationship Manager, Admin) with role-based access control and routing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing with role-based route guards
- **State Management**: TanStack Query for server state, React Context for local state (auth, contract selection)
- **UI Components**: Shadcn UI component library built on Radix UI primitives with Tailwind CSS
- **Layout Pattern**: Separate layout components for customer (CustomerLayout) and staff (StaffLayout) personas with sidebar navigation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful API endpoints under `/api` prefix
- **Session Management**: Express-session with configurable storage
- **Authentication**: Session-based auth with role middleware for protected routes

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions with Zod validation
- **Key Entities**: Users, Properties, Contracts, Bills, Documents, Notifications, ServiceRequests
- **Enums**: Role types (customer/rm/admin), property types, contract status, bill status, document categories

### Authentication & Authorization
- **Strategy**: Session-based authentication with cookies
- **Role System**: Three roles - customer, rm (relationship manager), admin
- **Route Protection**: `requireAuth` middleware for authentication, `requireRole` for authorization
- **Session Secret**: Configurable via `SESSION_SECRET` environment variable

### Build System
- **Development**: Vite dev server with HMR, proxied through Express
- **Production**: Vite builds to `dist/public`, Express serves static files
- **Server Bundle**: esbuild bundles server code with selective dependency bundling for faster cold starts

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and migrations
- **connect-pg-simple**: PostgreSQL session store (available but session storage configurable)

### UI Libraries
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, tabs, etc.)
- **Tailwind CSS**: Utility-first styling with custom theme configuration
- **Lucide React**: Icon library
- **date-fns**: Date formatting and manipulation

### Form & Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation shared between client and server
- **drizzle-zod**: Generates Zod schemas from Drizzle table definitions

### Replit Integration
- **@replit/vite-plugin-runtime-error-modal**: Error overlay in development
- **@replit/vite-plugin-cartographer**: Development tooling (dev only)
- **@replit/vite-plugin-dev-banner**: Development banner (dev only)

## Recent Changes (February 2026)

### Admin Edit Functionality
- PUT endpoints for `/api/admin/users/:id`, `/api/admin/properties/:id`, `/api/admin/contracts/:id`
- Edit dialogs pre-fill with existing entity data
- Server-side validation using Zod partial schemas

### Bulk Import/Export
- CSV template download for users, properties, contracts
- Export current data as CSV
- Bulk import via CSV file upload with row-level validation
- Server returns `{ row: number, error: string }[]` for validation errors

### Test Credentials
- Admin: `admin` / `admin123`
- Customer: `john.doe` / `demo123`
- RM: `rm.sarah` / `demo123`

### RM My Properties & Document Upload
- RMs can view all properties/contracts assigned to them with customer details
- RMs can upload documents from their PC for managed properties (uses Replit Object Storage)
- File upload flow: select file -> presigned URL -> upload to GCS -> save object path in DB
- Documents appear on customer's Documents page for download
- API routes: GET /api/rm/properties, GET/POST /api/rm/documents, POST /api/uploads/request-url (auth required)
- Object storage serves files via GET /objects/* route

### RM Bills & Rent Management
- RMs can create bill entries for contracts they manage
- RMs can mark bills as overdue, paid, or unpaid
- Bills appear on customer's Bills page
- API routes: GET/POST /api/rm/bills, PATCH /api/rm/bills/:id/status, GET /api/rm/contracts