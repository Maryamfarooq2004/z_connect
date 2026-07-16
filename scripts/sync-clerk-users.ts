import { createClerkClient } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();
dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Error: DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("supabase.com") ? { rejectUnauthorized: false } : undefined
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function sync() {
  try {
    console.log("1. Deleting legacy local database records from 'users' table...");
    await prisma.user.deleteMany();
    console.log("Database 'users' table cleared.");

    console.log("2. Querying Clerk Backend API to retrieve registered users...");
    const clerkUsersResponse = await clerkClient.users.getUserList({
      limit: 100
    });
    
    const clerkUsers = Array.isArray(clerkUsersResponse) 
      ? clerkUsersResponse 
      : (clerkUsersResponse as any).data || [];
      
    console.log(`Found ${clerkUsers.length} users in Clerk.`);

    console.log("3. Seeding active Clerk users into local PostgreSQL database...");
    for (const u of clerkUsers) {
      const email = u.emailAddresses?.[0]?.emailAddress?.toLowerCase();
      if (!email) continue;

      const username = u.username || email.split("@")[0] || `user_${u.id.substring(5, 15)}`;
      const fullName = u.fullName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || username;

      console.log(`-> Inserting user: ${email} (${u.id})`);
      await prisma.user.create({
        data: {
          clerkId: u.id,
          email,
          username,
          fullName,
          profileImage: u.imageUrl || "",
          bio: ""
        }
      });
    }

    console.log("Seeding process completed successfully!");
  } catch (error) {
    console.error("Sync operation encountered an error:", error);
  } finally {
    await pool.end();
  }
}

sync();
