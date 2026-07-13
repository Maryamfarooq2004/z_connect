import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";

export async function verifyAuthRequest(req: Request) {
  const reqHeaders = await headers();
  const authHeader = reqHeaders.get("authorization") || "";

  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  return verifyAccessToken(token) as any;
}

// Global response helper
export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
}
