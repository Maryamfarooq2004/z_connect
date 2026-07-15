import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "./db";

export async function verifyAuthRequest(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  // Find user by clerkId
  let user = await prisma.user.findUnique({
    where: { clerkId: userId }
  });

  if (!user) {
    const { currentUser } = await import("@clerk/nextjs/server");
    const clerkUser = await currentUser();
    const email = clerkUser?.primaryEmailAddress?.emailAddress;

    if (email) {
      // Try to find the existing database user by email to link them
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (user) {
        // Link the user with their Clerk ID
        user = await prisma.user.update({
          where: { id: user.id },
          data: { clerkId: userId }
        });
      }
    }
  }

  return user;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
}
