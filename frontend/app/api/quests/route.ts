import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import { QuestService } from "@/lib/services/quest.service";
import { QuestInput } from "@/types/backend/quest.types";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const input: QuestInput = await request.json();

    // Validate required fields
    if (!input.questName || !input.questDescription || !input.creator) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: questName, questDescription, creator",
        },
        { status: 400 }
      );
    }

    const result = await QuestService.createQuest(input);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error creating quest:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create quest",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const creator = searchParams.get("creator");
    const status = searchParams.get("status");
    const difficulty = searchParams.get("difficulty");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    const filters: any = {};
    if (creator) filters.creator = creator;
    if (status) filters.status = status;
    if (difficulty) filters.difficulty = difficulty;
    if (limit) filters.limit = parseInt(limit);
    if (offset) filters.offset = parseInt(offset);

    const result = await QuestService.getAllQuests(filters);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error getting quests:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get quests",
      },
      { status: 500 }
    );
  }
}

