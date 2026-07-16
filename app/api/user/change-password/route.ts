import { NextResponse } from "next/server";
import { verifyAuthRequest, unauthorizedResponse } from "@/lib/auth-middleware";

export async function PATCH(req: Request) {
  try {
    const userPayload: any = await verifyAuthRequest(req);
    if (!userPayload) {
      return unauthorizedResponse();
    }

    // Passwords are now managed entirely by Clerk. Return success stub.
    return NextResponse.json({ 
      success: true, 
      message: "Password management is delegated to Clerk." 
    }, { status: 200 });

  } catch (err: any) {
    console.error("User Change Password Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
