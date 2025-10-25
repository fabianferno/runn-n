import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import { QuestCompletionService } from "@/lib/services/quest-completion.service";

export async function GET(
  request: NextRequest,
  { params }: { params: { completionId: string } }
) {
  try {
    await connectDB();
    
    const { completionId } = params;
    const result = await QuestCompletionService.getCompletion(completionId);

    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error getting completion:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get completion",
      },
      { status: 500 }
    );
  }
}

