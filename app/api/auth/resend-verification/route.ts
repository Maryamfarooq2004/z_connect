import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    return NextResponse.json({
      success: true,
      message: "Verification link resent successfully.",
    }, { status: 200 });
  } catch (err: any) {
    console.error("Resend Verification Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
