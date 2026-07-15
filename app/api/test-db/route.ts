import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const userCount = await prisma.user.count();

    return Response.json({
      success: true,
      database: "postgresql",
      userCount,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
