import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import { mockPaths } from "@/lib/data/mock-data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connectDB();
    
    const { userId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit") || "50";
    const offset = searchParams.get("offset") || "0";

    const userPaths = Array.from(mockPaths.values())
      .filter((path) => path.user === userId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(
        parseInt(offset),
        parseInt(offset) + parseInt(limit)
      );

    return NextResponse.json({
      success: true,
      paths: userPaths,
      total: userPaths.length,
      hasMore: userPaths.length === parseInt(limit),
    });
  } catch (error: unknown) {
    console.error("Error getting paths:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 }
    );
  }
}

