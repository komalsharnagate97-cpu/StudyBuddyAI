# Admin Panel

## Overview

This is a standalone Admin Panel built with React, TypeScript, Vite, and TailwindCSS. The application provides comprehensive management capabilities for a digital business platform, including user management, product administration, referral tracking, and team coordination. The system integrates with Supabase for authentication and PostgreSQL via Drizzle ORM for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and developer experience
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: TailwindCSS with Shadcn/ui component library for consistent, modern UI
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Server Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Database Provider**: Neon serverless PostgreSQL for scalable cloud database
- **API Pattern**: RESTful API design with organized route handlers
- **Session Management**: Express sessions with PostgreSQL store for persistent authentication

### Authentication & Authorization
- **Primary Auth**: Supabase Auth for email/password authentication
- **Session Management**: Server-side sessions with automatic token refresh
- **Route Protection**: Client-side route guards with authentication state management
- **Admin Access**: Role-based access control for administrative functions

### Database Design
- **Core Entities**: Users, Products, Payments, Referrals, Withdrawals, Notifications, FAQ, Campaigns, AI Config, Team Members
- **Schema Management**: Drizzle migrations with version control
- **Data Validation**: Zod schemas for runtime type checking and validation
- **Relationships**: Foreign key constraints and proper relational design

### Component Architecture
- **Layout System**: Centralized AdminLayout with responsive navigation
- **Component Library**: Custom components built on Radix UI primitives
- **Reusable Components**: MetricCard, tables, forms, and modals for consistent UX
- **Feature Organization**: Components organized by domain (auth, dashboard, clients, etc.)

## External Dependencies

### Database & Backend Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Supabase**: Authentication service with social login capabilities
- **Drizzle Kit**: Database migration and schema management tools

### UI & Styling Framework
- **Radix UI**: Headless component primitives for accessibility
- **Shadcn/ui**: Pre-built component library with Tailwind integration
- **Lucide React**: Icon library for consistent iconography
- **TailwindCSS**: Utility-first CSS framework with design tokens

### Development & Build Tools
- **Vite**: Fast build tool with HMR and optimized bundling
- **TypeScript**: Static type checking and enhanced developer experience
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind integration

### State Management & Data Fetching
- **TanStack Query**: Server state management with caching and synchronization
- **React Hook Form**: Performant form library with validation
- **Zod**: Runtime schema validation and type inference
- **Date-fns**: Date manipulation and formatting utilities

### Development Environment
- **Replit Integration**: Cloud development environment with live preview
- **Dev Tools**: Runtime error overlay and development banners
- **Hot Module Replacement**: Fast development iteration with Vite HMR

## Recent Changes

### October 3, 2025 - GitHub Import Setup
- Successfully imported project from GitHub repository
- Configured Replit environment for development
- Set up workflow "Start application" running on port 5000
- Verified Neon database connection (DATABASE_URL configured)
- Confirmed Vite dev server with HMR working correctly
- Application successfully serving on http://0.0.0.0:5000

### Environment Configuration
- **Node.js**: v20 installed and configured
- **Database**: Connected to Neon PostgreSQL via existing DATABASE_URL
- **Port Configuration**: Frontend and backend both on port 5000 (Replit requirement)
- **Vite Settings**: allowedHosts set to true for Replit proxy support
- **Authentication**: Supabase auth (optional) with backend fallback system

### Optional Configuration
Users can optionally configure Supabase authentication by adding these secrets:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (backend only)

If not configured, the application automatically falls back to backend authentication.