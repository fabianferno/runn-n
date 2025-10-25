import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import { QuestCompletionService } from "@/lib/services/quest-completion.service";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { questId, userId } = await request.json();

    if (!questId || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: questId, userId",
        },
        { status: 400 }
      );
    }

    const result = await QuestCompletionService.registerCompletion(
      questId,
      userId
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error registering completion:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to register completion",
      },
      { status: 500 }
    );
  }
}

