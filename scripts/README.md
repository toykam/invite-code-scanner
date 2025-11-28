# Admin Creation Script

This script allows you to create admin accounts via the command line.

## Usage

Run the script using npm:

```bash
npm run create-admin
```

## Interactive Prompts

The script will ask you for the following information:

1. **Admin Name**: Full name of the admin user
2. **Email Address**: Valid email address (must be unique)
3. **Password**: Minimum 8 characters
4. **Role**: Either `admin` or `superadmin` (defaults to `admin`)

## Roles

- **admin**: Basic admin access to manage events and scanners
- **superadmin**: Full access including admin user management

## Example

```bash
$ npm run create-admin

=== Create Admin Account ===

Admin Name: John Doe
Email Address: john@example.com
Password (min 8 characters): ********
Role (admin/superadmin) [admin]: superadmin

✅ Admin account created successfully!

Details:
  Name: John Doe
  Email: john@example.com
  Role: superadmin
  ID: clxxx...

You can now login at: /admin/login
```

## First Time Setup

If you're setting up the system for the first time:

1. Run database migrations: `npx prisma migrate dev`
2. Create your first superadmin: `npm run create-admin`
3. Login at `/admin/login`
4. Start creating events and scanners from the admin panel

## Security Notes

- Passwords are hashed using bcrypt before being stored
- Email addresses must be unique
- The script validates all input before creating the account
- Only use this script in a secure environment (never expose credentials)
