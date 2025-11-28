import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import * as bcrypt from "bcryptjs";
import * as readline from "readline";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Load environment variables
config();

// Check for DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  console.error("Please create a .env file with your database connection string");
  console.error("\nExample .env file:");
  console.error("DATABASE_URL=postgresql://user:password@localhost:5432/dbname");
  process.exit(1);
}

// Create Prisma client
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// admin@eventinvitescanner.com

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createAdmin() {
  try {
    console.log("\n=== Create Admin Account ===\n");

    const name = await question("Admin Name: ");
    if (!name.trim()) {
      console.error("❌ Name is required");
      process.exit(1);
    }

    const email = await question("Email Address: ");
    if (!email.trim() || !email.includes("@")) {
      console.error("❌ Valid email is required");
      process.exit(1);
    }

    // Check if email already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: email.trim() },
    });

    if (existingAdmin) {
      console.error("❌ An admin with this email already exists");
      process.exit(1);
    }

    const password = await question("Password (min 8 characters): ");
    if (!password || password.length < 8) {
      console.error("❌ Password must be at least 8 characters");
      process.exit(1);
    }

    const roleInput = await question("Role (admin/superadmin) [admin]: ");
    const role = roleInput.trim().toLowerCase() || "admin";
    
    if (role !== "admin" && role !== "superadmin") {
      console.error("❌ Role must be either 'admin' or 'superadmin'");
      process.exit(1);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the admin
    const admin = await prisma.admin.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        password: hashedPassword,
        role,
      },
    });

    console.log("\n✅ Admin account created successfully!\n");
    console.log("Details:");
    console.log(`  Name: ${admin.name}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Role: ${admin.role}`);
    console.log(`  ID: ${admin.id}`);
    console.log(`  Password: ${password}`);
    console.log("\nYou can now login at: /admin/login\n");

  } catch (error) {
    console.error("\n❌ Error creating admin:", error);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createAdmin();
