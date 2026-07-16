import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "./db";

export async function verifyAuthRequest(_req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  // 1. Find user by clerkId
  let user = await prisma.user.findUnique({
    where: { clerkId: userId }
  });

  // 2. If user is not found, attempt to sync from Clerk
  if (!user) {
    const { currentUser } = await import("@clerk/nextjs/server");
    const clerkUser = await currentUser();
    
    if (clerkUser) {
      const email = clerkUser.primaryEmailAddress?.emailAddress;
      
      if (email) {
        const normalizedEmail = email.toLowerCase();
        
        // Check if there is an existing database user by email
        user = await prisma.user.findUnique({
          where: { email: normalizedEmail }
        });

        if (user) {
          // Link the existing user with their Clerk ID
          user = await prisma.user.update({
            where: { id: user.id },
            data: { clerkId: userId }
          });
        } else {
          // Auto-create a new user record
          const username = clerkUser.username || email.split("@")[0] || `user_${userId.substring(5, 15)}`;
          const fullName = clerkUser.fullName || `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || username;

          user = await prisma.user.create({
            data: {
              clerkId: userId,
              email: normalizedEmail,
              username,
              fullName,
              profileImage: clerkUser.imageUrl || "",
              bio: ""
            }
          });
        }
      }
    }
  }

  return user;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
}
