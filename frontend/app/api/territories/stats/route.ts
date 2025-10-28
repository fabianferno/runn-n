import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import { mockUsers, mockRegions, mockPaths } from "@/lib/data/mock-data";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Calculate stats
    let totalHexes = 0;
    const activeRegions = new Set<string>();

    mockRegions.forEach((region: {metadata: {hexCount: number}; _id: string}) => {
      totalHexes += region.metadata.hexCount;
      activeRegions.add(region._id);
    });

    // Create leaderboard
    const leaderboard = Array.from(mockUsers.values())
      .sort((a: {stats: {totalHexes: number}}, b: {stats: {totalHexes: number}}) => b.stats.totalHexes - a.stats.totalHexes)
      .slice(0, 10)
      .map((user: {_id: string; color: string; stats: {totalHexes: number}}, index: number) => ({
        userId: user._id,
        color: user.color,
        hexCount: user.stats.totalHexes,
        rank: index + 1,
      }));

    return NextResponse.json({
      success: true,
      stats: {
        totalHexesCaptured: totalHexes,
        totalRegionsActive: activeRegions.size,
        totalPlayers: mockUsers.size,
        totalPaths: mockPaths.size,
        leaderboard,
        lastUpdate: Date.now(),
      },
    });
  } catch (error: unknown) {
    console.error("Error getting stats:", error);
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

