# Delete Functionality Implementation

## Overview
Added comprehensive delete functionality for Events, Scanners, and Admins with smart soft/hard delete logic.

## Features Implemented

### 1. Smart Delete Logic
- **Soft Delete (Default)**: Deactivates resources by setting `isActive: false`
- **Hard Delete (Permanent)**: Permanently removes resources from database when safe
- **Protection**: Prevents hard delete when resources have dependencies (scans recorded)

### 2. API Endpoints

#### Events - `/api/events/[slug]`
- **DELETE** endpoint supports `?permanent=true` query parameter
- Checks if event has scans before allowing hard delete
- Cascades delete to `ScannerAssignment` records
- Returns appropriate error messages with scan count

#### Scanners - `/api/scanners/[id]/route.ts` (NEW)
- **DELETE** endpoint supports `?permanent=true` query parameter
- Checks if scanner has recorded scans before allowing hard delete
- Cascades delete to `ScannerAssignment` records
- Uses transaction for atomic operations

#### Admins - `/api/admin/[id]`
- **DELETE** endpoint supports `?permanent=true` query parameter
- Prevents self-deletion (admin cannot delete their own account)
- Requires `currentAdminId` in request body for validation
- Hard delete available for admins without restrictions

### 3. UI Components

#### Admin Panel (`/admin/page.tsx`)
Added three delete handler functions:
- `deleteEvent()` - Handles event deletion with confirmation dialogs
- `deleteScanner()` - Handles scanner deletion with scan count check
- `deleteAdmin()` - Handles admin deletion with self-deletion prevention

#### Events Tab
- Red "Delete" button added to each event card
- Automatically uses soft delete if event has scans
- Confirmation dialog shows scan count and delete type

#### Scanners Tab
- Red "Delete" button added next to "Manage Assignments"
- Layout updated to accommodate both buttons
- Shows scan count before deletion

#### Admins Tab
- Red "Delete" button added next to "Activate/Deactivate"
- Only visible for other admins (not current user)
- Always performs hard delete (admins have no scan dependencies)

### 4. User Experience

#### Confirmation Dialogs (SweetAlert2)
- **Events/Scanners with scans**: 
  - Warning that resource will be deactivated only
  - Explains permanent delete requires removing scans first
  - Button text: "Deactivate"
  
- **Events/Scanners without scans**:
  - Strong warning that action cannot be undone
  - Confirmation text emphasizes permanence
  - Button text: "Yes, delete permanently"
  
- **Admins**:
  - Always permanent delete warning
  - Cannot delete own account (separate error dialog)
  - Button text: "Yes, delete permanently"

#### Color Coding
- Destructive red buttons (`bg-red-600`)
- Warning yellow/orange for deactivate actions
- Consistent with existing UI patterns

### 5. Database Safety

#### Transaction Safety
```typescript
await prisma.$transaction([
  prisma.scannerAssignment.deleteMany({ where: { scannerId: id } }),
  prisma.scanner.delete({ where: { id } })
]);
```

#### Cascade Delete
- `ScannerAssignment` records deleted before parent resource
- Prevents foreign key constraint violations
- Maintains database integrity

#### Validation Checks
- Count scans before allowing hard delete
- Verify resource exists before attempting delete
- Check authentication/authorization (admin self-deletion)

### 6. Error Handling

All endpoints return appropriate status codes:
- `200` - Success (soft or hard delete completed)
- `400` - Bad Request (has scans, cannot self-delete, etc.)
- `404` - Not Found (resource doesn't exist)
- `500` - Server Error (unexpected failures)

Detailed error messages:
- "Cannot delete scanner with 5 scans recorded. Deactivate instead."
- "You cannot delete your own account"
- "Scanner not found"

## Usage Examples

### Soft Delete (Default)
```bash
DELETE /api/events/food-summit-2025
# Deactivates event (sets isActive: false)
```

### Hard Delete
```bash
DELETE /api/events/food-summit-2025?permanent=true
# Permanently removes event if no scans exist
```

### Admin Delete with Self-Protection
```bash
DELETE /api/admin/cuid123?permanent=true
Content-Type: application/json
{
  "currentAdminId": "cuid456"
}
# Returns 400 if cuid123 === cuid456
```

## Testing Checklist

### Events
- [ ] Soft delete event with scans → deactivates
- [ ] Hard delete event without scans → permanently deleted
- [ ] Hard delete event with scans → returns error with count
- [ ] UI shows correct dialog based on scan count

### Scanners
- [ ] Soft delete scanner with scans → deactivates
- [ ] Hard delete scanner without scans → permanently deleted + assignments removed
- [ ] Hard delete scanner with scans → returns error with count
- [ ] UI shows correct dialog based on scan count

### Admins
- [ ] Hard delete other admin → permanently deleted
- [ ] Attempt to delete own account → error dialog shown
- [ ] Delete button not shown for current admin
- [ ] UI properly hides delete button for self

## Files Modified

### API Routes
1. `/src/app/api/events/[slug]/route.ts` - Updated DELETE handler
2. `/src/app/api/scanners/[id]/route.ts` - Created new file with DELETE handler
3. `/src/app/api/admin/[id]/route.ts` - Updated DELETE handler

### UI Components
4. `/src/app/admin/page.tsx` - Added delete handlers and buttons to all tabs

## Breaking Changes
None - all changes are additive or backward compatible.

## Migration Notes
No database migrations required. Existing soft delete behavior preserved as default.
