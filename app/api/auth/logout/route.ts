import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const response = NextResponse.json({ success: true, message: "Logged out successfully" }, { status: 200 });
    
    // Clear the zconnect_refresh_token cookie
    response.cookies.delete("zconnect_refresh_token");
    
    return response;
  } catch (err: any) {
    console.error("Logout Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
