# StudyBuddyAI - Admin Panel

A comprehensive admin panel built with React, TypeScript, Express.js, and Supabase for managing digital business operations.

## Features

### Admin Authentication
- Secure login/logout with Supabase authentication
- Session management with automatic redirect

### Core Management Features
- **Products Management**: Full CRUD operations for products with pricing and status
- **AI Configuration**: Configure AI assistants per product with custom prompts and settings
- **Client & Lead Management**: Manage users, leads, and client information with export functionality
- **FAQ Management**: Organize and manage frequently asked questions by category
- **Notification System**: Send immediate notifications or schedule them for later
- **Campaign Management**: Create and manage marketing campaigns
- **Referral & Wallet**: Handle referral programs and commission withdrawals
- **Team Management**: Manage team members, roles, and permissions

### Dashboard Analytics
- Total users count
- Revenue tracking (calculated from completed payments)
- Conversion rate metrics
- Active campaigns overview
- Recent activity monitoring

## Technology Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **TailwindCSS** with Shadcn/ui components for modern UI
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management
- **React Hook Form** with Zod validation
- **Framer Motion** for animations

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** with PostgreSQL for type-safe database operations
- **Neon** serverless PostgreSQL database
- **RESTful API** design with organized route handlers

### Authentication & Database
- **Supabase Auth** for email/password authentication
- **PostgreSQL** database with comprehensive schema
- **Row Level Security (RLS)** enabled for enhanced security

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Supabase account and project

### 1. Installation

```bash
npm install
```

### 2. Environment Configuration

Copy the environment template:
```bash
cp .env.example .env
```

Fill in your actual Supabase values in `.env`:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Database URL (for Drizzle if needed)
DATABASE_URL=postgresql://user:password@host:port/database
```

**Important**: Replace the placeholder values with your actual Supabase project credentials:
- Get your Supabase URL and keys from your Supabase project dashboard
- Go to Project Settings > API to find your keys
- Never commit real API keys to version control

### 3. Database Setup

Execute the SQL schema in your Supabase project:

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Run the SQL commands

This will create all necessary tables:
- users, products, payments, referrals, withdrawals
- notifications, faq, campaigns, ai_config, team_members
- activity_log for audit trail
- Indexes, triggers, and RLS policies

### 4. Run the Application

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### 5. Admin Access

The schema includes a default admin user. You can either:
- Create an admin user directly in Supabase Auth
- Use the team_members table for admin access control
- Set up your own authentication flow

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── auth/      # Authentication components
│   │   │   ├── clients/   # Client management components
│   │   │   ├── dashboard/ # Dashboard components
│   │   │   ├── faq/       # FAQ management components
│   │   │   ├── layouts/   # Layout components
│   │   │   ├── notifications/ # Notification components
│   │   │   ├── products/  # Product management components
│   │   │   └── ui/        # Shadcn UI components
│   │   ├── hooks/         # React hooks
│   │   ├── lib/           # Utility libraries
│   │   └── pages/         # Page components
├── server/                # Backend Express application
│   ├── index.ts          # Main server file
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Database operations
│   └── vite.ts           # Vite dev server integration
├── shared/               # Shared types and schemas
│   └── schema.ts         # Drizzle schema and types
└── supabase-schema.sql   # Database schema
```

## API Endpoints

### Authentication
- Admin login/logout handled by Supabase Auth

### Core Endpoints
- `GET/POST/PUT/DELETE /api/products` - Product management
- `GET/POST/PUT /api/ai-config` - AI configuration
- `GET/POST/PUT /api/clients` - Client management
- `POST /api/clients/export` - Export clients to CSV
- `GET/POST/PUT/DELETE /api/faq` - FAQ management
- `GET /api/faq/categories` - FAQ categories
- `GET/POST /api/notifications` - Notification management
- `POST /api/notifications/send` - Send immediate notification
- `POST /api/notifications/schedule` - Schedule notification
- `GET/POST /api/campaigns` - Campaign management
- `GET /api/dashboard/metrics` - Dashboard metrics
- `GET /api/dashboard/activity` - Recent activity

### Referrals & Withdrawals
- `GET /api/referrals/metrics` - Referral analytics
- `GET /api/withdrawals` - Withdrawal requests
- `POST /api/withdrawals/:id/approve` - Approve withdrawal
- `POST /api/withdrawals/:id/reject` - Reject withdrawal
- `POST /api/withdrawals/:id/process` - Process withdrawal

## Development

### Building for Production
```bash
npm run build
```

### Type Checking
```bash
npm run check
```

### Database Migrations (if needed)
```bash
npm run db:push
```

## Security Features

- Row Level Security (RLS) enabled on all tables
- Authenticated user policies
- Secure session management
- Input validation with Zod schemas
- CSRF protection with credentials: "include"

## Browser Support

- Modern browsers with ES2020+ support
- Responsive design for desktop and mobile

## Environment Variables

All environment variables must be prefixed with `VITE_` for frontend access:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (backend only)
- `DATABASE_URL` - PostgreSQL connection string (if using Drizzle directly)

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables" error**
   - Make sure you've created `.env` file with valid Supabase credentials
   - Check that variables are prefixed with `VITE_` for frontend access

2. **Database connection issues**
   - Verify your DATABASE_URL is correct
   - Ensure your Supabase project is active
   - Check that the schema has been applied

3. **Authentication not working**
   - Verify Supabase Auth is enabled in your project
   - Check that RLS policies are properly configured
   - Ensure admin user exists in the system

4. **API requests failing**
   - Check network connectivity
   - Verify API endpoints are correctly configured
   - Check browser console for detailed error messages

### Getting Help

For development issues:
1. Check the browser console for errors
2. Verify environment variables are set correctly
3. Ensure database schema is applied
4. Check Supabase project settings and RLS policies

## License

MIT License - see LICENSE file for details.