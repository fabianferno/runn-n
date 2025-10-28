import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import { QuestCompletionService } from "@/lib/services/quest-completion.service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ completionId: string }> }
) {
  try {
    await connectDB();

    const { completionId } = await params;
    const { transactionHash } = await request.json();

    if (!transactionHash) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing transactionHash",
        },
        { status: 400 }
      );
    }

    const result = await QuestCompletionService.markAsMinted(
      completionId,
      transactionHash
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error marking as minted:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update completion",
      },
      { status: 500 }
    );
  }
}
