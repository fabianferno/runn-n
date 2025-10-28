import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import { QuestService } from "@/lib/services/quest.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ questId: string }> }
) {
  try {
    await connectDB();
    
    const { questId } = await params;
    const result = await QuestService.getQuestById(questId);

    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error getting quest:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error instanceof Error ? error.message : "Unknown error") || "Failed to get quest",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ questId: string }> }
) {
  try {
    await connectDB();
    
    const { questId } = await params;
    const updates = await request.json();

    const result = await QuestService.updateQuest(questId, updates);

    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error updating quest:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error instanceof Error ? error.message : "Unknown error") || "Failed to update quest",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ questId: string }> }
) {
  try {
    await connectDB();
    
    const { questId } = await params;
    const result = await QuestService.deleteQuest(questId);

    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error deleting quest:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error instanceof Error ? error.message : "Unknown error") || "Failed to delete quest",
      },
      { status: 500 }
    );
  }
}

