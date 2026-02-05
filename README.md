# ABC Real Estate Customer Portal

A comprehensive web application for managing real estate leases, enabling tenants to view their contracts, bills, documents, notifications, and submit service requests. The portal supports three personas: Customer (Tenant), Relationship Manager (RM), and Admin.

## Features

### Customer Portal
- **Dashboard**: View aggregated KPIs across all properties or per contract (sqft, rent, lease dates, renewal dates, security deposit, rent uplift)
- **Outstanding Bills**: View statement of account, download CSV, see rent history
- **Documents**: Browse and download contracts, lease deeds, invoices, and other documents
- **Notifications**: Receive and manage lease expiry reminders, maintenance notices, RM introductions
- **Contact Us**: View RM contact details, submit service requests, track request status

### Relationship Manager Portal
- **Dashboard**: Overview of assigned customers and pending service requests
- **My Customers**: View assigned customers and their contract details
- **Service Requests**: Manage service requests, update status, add notes

### Admin Portal
- **Dashboard**: System-wide statistics and quick links
- **Users**: View all users, create new customers/staff
- **Properties**: View all properties in the system
- **Contracts**: View all lease contracts
- **Service Requests**: Overview of all service requests

## Demo Credentials

### Customers
- **john.doe** / demo123 - Has 2 retail + 1 residential lease
- **jane.smith** / demo123 - Has 1 retail + 1 residential lease

### Relationship Managers
- **rm.michael** / demo123 - Assigned to John Doe's contracts
- **rm.sarah** / demo123 - Assigned to Jane Smith's contracts

### Admin
- **admin** / admin123 - Full system access

## Tech Stack

- **Frontend**: React, TypeScript, TanStack Query, Wouter, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based authentication

## How to Run

1. The application is already configured to run in Replit
2. Click the "Run" button to start the application
3. The app will be available at the provided URL
4. Use the demo credentials above to log in

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   │   ├── customer/   # Customer portal pages
│   │   │   ├── rm/         # RM portal pages
│   │   │   └── admin/      # Admin portal pages
│   │   └── lib/            # Utilities and contexts
├── server/                 # Express backend
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Database operations
│   ├── seed.ts             # Demo data seeding
│   └── db.ts               # Database connection
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Drizzle schema definitions
```

## Seeded Demo Data

- 2 Customers with multiple contracts (retail + residential)
- 5 Properties (3 retail, 2 residential) across Mumbai, Delhi, and Gurugram
- 5 Contracts with various statuses (active, pending_renewal)
- Bills for Oct 2024 - Feb 2025 with mixed payment statuses
- Documents across all categories for each contract
- Notifications (RM introduction, lease expiry, maintenance, termination)
- Service requests with various statuses (new, in_progress, resolved)
