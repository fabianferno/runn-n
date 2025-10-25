import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import { RegionService } from "@/lib/services/region.service";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { updates } = await request.json();

    if (!updates || typeof updates !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
        },
        { status: 400 }
      );
    }

    const result = await RegionService.batchUpdate(updates);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error batch updating:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

