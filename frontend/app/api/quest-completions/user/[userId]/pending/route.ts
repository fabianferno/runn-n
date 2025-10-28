import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import { QuestCompletionService } from "@/lib/services/quest-completion.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connectDB();

    const { userId } = await params;
    const result = await QuestCompletionService.getUserPendingCompletions(
      userId
    );
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error getting user completions:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get completions",
      },
      { status: 500 }
    );
  }
}
