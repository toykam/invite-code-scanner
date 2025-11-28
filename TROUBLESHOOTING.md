# Troubleshooting Guide

## "Unexpected token '<', '<!DOCTYPE'... is not valid JSON" Error

This error occurs when the API returns an HTML error page instead of JSON. This typically happens when:

1. **The Prisma Client is outdated** - The server is trying to use database models that don't exist in the generated client
2. **The dev server hasn't been restarted** after regenerating Prisma client

### Solution:

#### Step 1: Regenerate Prisma Client
```bash
npm run prisma:generate
```

Or manually:
```bash
npx prisma generate
```

#### Step 2: Restart the Dev Server
This is **critical** - Next.js loads the Prisma client when it starts, so you must restart:

1. Stop your dev server (press `Ctrl+C` in the terminal running `npm run dev`)
2. Start it again:
```bash
npm run dev
```

### Why This Happens

Next.js caches the Prisma client in memory when the dev server starts. If you:
- Update the database schema
- Run migrations
- Regenerate the Prisma client

The running dev server will still be using the **old** version of the Prisma client. This causes the server to crash when trying to access new models (like `ScannerAssignment`), which results in Next.js returning an HTML error page instead of JSON.

### Other Common Issues

#### Database Connection Issues
Check your `.env` file has the correct `DATABASE_URL`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/database_name
```

#### Migration Issues
If you see errors about missing tables:
```bash
npx prisma migrate dev
```

#### Check Server Logs
Look at your terminal running `npm run dev` for detailed error messages. The improved error handling will show you the exact error in development mode.

## "Failed to create" Errors

If you're getting "Failed to create scanner/admin/event" errors:

1. Check the browser console for detailed error messages
2. Check the server terminal for error logs
3. In development mode, the API will return the actual error message
4. Common causes:
   - Duplicate phone numbers (scanners must have unique phone numbers)
   - Duplicate emails (admins must have unique emails)
   - Duplicate slugs (events must have unique slugs)
   - Database connection issues
   - Missing required fields

## Quick Reset

If things are really broken, try this full reset:

```bash
# 1. Regenerate Prisma client
npx prisma generate

# 2. Reset database (WARNING: This deletes all data!)
npx prisma migrate reset

# 3. Create a new admin
npm run create-admin

# 4. Restart dev server
# Stop with Ctrl+C, then:
npm run dev
```
