# Invite Code Scanner - AI Agent Instructions

## Project Overview
Multi-event check-in system using QR code scanning to validate and track attendee/driver invites. Built with Next.js 15 (App Router), Prisma ORM, and PostgreSQL. Features scanner authentication tracking scans per user.

## Architecture

### Core Flow
1. **Frontend**: 
   - Home page (`/`) lists active events
   - Scanner login at `/scan/[slug]/login` with phone + PIN
   - Event-specific scanner at `/scan/[slug]` (requires scanner authentication)
   - Admin login at `/admin/login` with email + password
   - Admin panel at `/admin` with tabbed interface (Events/Scanners/Admins)
2. **API Routes**: 
   - `/api/events` - CRUD operations for events
   - `/api/scanners` - Scanner management (create, list)
   - `/api/scanners/login` - PIN-based scanner authentication
   - `/api/admin` - Admin CRUD (create, list, update, soft delete)
   - `/api/admin/login` - Email + password admin authentication with bcrypt
   - `/api/confirm-invite` - Validates codes per event with transaction safety + scanner tracking
   - `/api/total-scanned-invites` - Event-scoped counting
3. **Database**: `Event`, `Scanner`, `Admin`, and `Invite` models with proper relationships

### Key Components
- **`src/components/Scanner.tsx`**: Client-side QR scanner (requires `eventSlug`, `eventName`, and `scannerId` props)
- **`src/app/scan/[slug]/login/page.tsx`**: Scanner authentication page (phone + PIN)
- **`src/app/scan/[slug]/page.tsx`**: Event-specific scanner page with auth check
- **`src/app/admin/login/page.tsx`**: Admin authentication page (email + password with bcrypt)
- **`src/app/admin/page.tsx`**: Tabbed admin panel (Events/Scanners/Admins) with role-based access
- **`src/app/api/events/route.ts`**: Event CRUD endpoints
- **`src/app/api/scanners/route.ts`**: Scanner management endpoints
- **`src/app/api/admin/route.ts`**: Admin CRUD endpoints with password hashing
- **`src/app/api/admin/login/route.ts`**: Admin authentication with bcrypt
- **`src/app/api/confirm-invite/route.ts`**: Transaction-safe invite validation with scanner tracking
- **`src/lib/prisma.ts`**: Singleton Prisma client instance

## Database Schema
```prisma
model Event {
  id                    String   @id @default(cuid())
  slug                  String   @unique  // URL-friendly identifier
  name                  String
  codePrefix            String   // e.g., "FS25", "CONF24"
  attendantCodePattern  String   // Regex for validation
  driverCodePattern     String?  // Optional driver codes
  isActive              Boolean  @default(true)
  invites               Invite[]
  scannerAssignments    ScannerAssignment[]  // Many-to-many with scanners
}

model Scanner {
  id           String   @id @default(cuid())
  name         String
  phoneNumber  String?  @unique
  email        String?
  pin          String   // Simple PIN for authentication
  isActive     Boolean  @default(true)
  eventAssignments ScannerAssignment[]  // Many-to-many with events
  invites          Invite[]
}

model ScannerAssignment {
  id         String   @id @default(cuid())
  scannerId  String
  eventId    String
  assignedAt DateTime @default(now())
  scanner    Scanner  @relation(...)
  event      Event    @relation(...)
  
  @@unique([scannerId, eventId])  // One assignment per scanner-event pair
}

model Admin {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String   // Hashed with bcryptjs
  role      String   @default("admin")  // "admin" or "superadmin"
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Invite {
  id           String   @id @default(cuid())
  inviteQrCode String
  eventId      String
  scannerId    String   // Tracks which scanner scanned it
  event        Event    @relation(...)
  scanner      Scanner  @relation(...)
  
  @@unique([inviteQrCode, eventId])  // Code can be reused across events
}
```

**Critical**: 
- Codes are single-use per event. Composite unique constraint allows same code across different events.
- Many-to-many relationship: Multiple scanners can be assigned to one event, and one scanner can be assigned to multiple events.
- All assignments managed through the `ScannerAssignment` join table.

## Business Logic: Multi-Event Support & Authentication

### Dynamic Code Validation
Each event defines its own validation patterns stored in the database. Validation happens at runtime using `new RegExp(event.attendantCodePattern)` - no hardcoded patterns.

### Scanner Authentication & Assignment
- Scanners are created independently without event assignment
- Admins can assign scanners to multiple events via the admin panel
- Simple phone + PIN authentication (stored in localStorage)
- Phone numbers must be unique across all scanners
- Each scan is tracked to specific scanner via `scannerId`
- Login requires scanner to be assigned to the event being scanned
- Scanner assignments tracked in `ScannerAssignment` join table

### Admin Authentication
- Email + password authentication with bcrypt hashing
- Two roles: "admin" (basic access) and "superadmin" (full access including admin management)
- Admin credentials stored in localStorage after login
- Role-based UI rendering (Admins tab only visible to superadmins)
- Soft delete pattern (isActive field) instead of hard deletes
- Admins cannot deactivate their own accounts

### Race Condition Prevention
Uses Prisma transactions with check-and-insert atomicity:
```typescript
await prisma.$transaction(async (tx) => {
  const existing = await tx.invite.findFirst({ where: { inviteQrCode, eventId } });
  if (existing) throw new Error("ALREADY_USED");
  return await tx.invite.create({ data: { inviteQrCode, eventId, scannerId } });
});
```

## Development Workflow

### Local Setup
```bash
npm install
# Set up .env with DATABASE_URL (see .env.example)
npx prisma generate          # Generate client to src/generated/prisma
npx prisma migrate dev       # Apply migrations
npm run dev                  # Start dev server (uses Turbopack)
```

### Database Changes
Always run `prisma migrate dev --name <description>` after schema edits, then `prisma generate`.

### Creating First Event
1. Run migrations to create database schema
2. Navigate to `/admin/login` and create a superadmin account
3. Login and navigate to Events tab
4. Create event with improved form (better styling, validation hints)
5. Switch to Scanners tab and create scanner accounts for the event
6. Access scanner at `/scan/[slug]` → redirects to login
7. Login with phone + PIN → start scanning

## Patterns & Conventions

### API Routes
- Return structured JSON: `{ message: string, ...data }`
- Status codes: 200 (success), 201 (created), 400 (validation), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error)
- Log errors to console before returning 500
- Use `async (req: Request, { params }: RouteParams)` for dynamic routes

### Client-Side Components
- Use `"use client"` directive for browser API access (camera, localStorage, etc.)
- Props required: Scanner needs `eventSlug`, `eventName`, and `scannerId`
- Check localStorage for scanner auth before rendering Scanner component
- Pause scanning during API calls to prevent duplicate submissions
- Show loading states via `Swal.showLoading()`

### Event Routing
- Home page (`/`) shows active events selector
- Scanner login at `/scan/[slug]/login` (improved UI with gradient background)
- Scanner pages at `/scan/[slug]` validate event is active + scanner auth
- Admin login at `/admin/login` (purple gradient background, email + password)
- Admin panel at `/admin` with tabbed interface (Events/Scanners/Admins) and role-based access
- Event details at `/admin/events/[slug]`

### Error Handling
- Backend: Try-catch with console logs + generic 500 responses
- Frontend: Display user-friendly error dialogs via SweetAlert2
- Transaction errors use custom error codes (e.g., "ALREADY_USED")

## UI Improvements
- Admin panel: Tabbed interface (Events/Scanners/Admins), modern cards, better form styling, role-based access
- Admin login: Purple gradient background, email + password form
- Scanner login: Gradient background, centered form, clear icons
- Event cards: Status badges with rings, color-coded metrics, hover effects
- Responsive: Mobile-first design with sm: breakpoints

## Scaling Considerations

### Implemented Solutions ✅
- Database transactions with row-level locking for atomic check-and-insert
- Event-scoped invite validation (prevents cross-event conflicts)
- Scanner authentication and tracking per event
- Admin authentication with bcrypt password hashing and role-based access control
- Composite unique index on `(inviteQrCode, eventId)` and `(phoneNumber, eventId)`

### Recommended Improvements
- Implement Prisma connection pooling (PgBouncer or Prisma Accelerate)
- Add Redis caching layer for:
  - Event lookups by slug (frequently accessed)
  - Scanned codes per event (prevent duplicate DB checks)
  - Total count statistics
- Replace localStorage authentication with JWT tokens or session management
- Add password hashing for scanner PIN storage (currently plain text)
- Consider rate limiting on `/api/confirm-invite` endpoint
- Split reads (stats, counts) from writes (confirm) to different database replicas
- Add password strength requirements and validation

### Deployment
Best deployed on Vercel (Next.js native platform). Ensure:
- `DATABASE_URL` environment variable points to production PostgreSQL
- Connection pooling enabled (essential for serverless)
- Consider Prisma Data Proxy for connection management at scale
- Store scanner sessions securely (not just localStorage)
