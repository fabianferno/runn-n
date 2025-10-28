import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import { PathService } from "@/lib/services/path.service";
import { PathInput } from "@/types/backend";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const input: PathInput = await request.json();

    if (!input.user || !input.color || !input.path) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: user, color, path",
        },
        { status: 400 }
      );
    }

    const result = await PathService.processPath(input);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error processing path:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : "Failed to process path",
      },
      { status: 500 }
    );
  }
}
