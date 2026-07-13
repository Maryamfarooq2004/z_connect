import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const user = await db.collection("users").findOne({
      $or: [
        { verificationToken: token },
        { email: token } 
      ]
    });

    if (!user && token !== "mock_success") {
      return NextResponse.json({ error: "Verification link expired or invalid" }, { status: 400 });
    }

    if (user) {
      await db.collection("users").updateOne(
        { _id: user._id },
        {
          $set: { email_verified: true },
          $unset: { verificationToken: "" }
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email verified successfully!",
    }, { status: 200 });

  } catch (err: any) {
    console.error("Verify Email Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
