import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import { RegionService } from "@/lib/services/region.service";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const bounds = searchParams.get("bounds");
    const resolution = searchParams.get("resolution");

    if (!bounds) {
      return NextResponse.json(
        {
          success: false,
          error: "Bounds parameter is required",
        },
        { status: 400 }
      );
    }

    // Parse bounds: "lng1,lat1,lng2,lat2"
    const [west, south, east, north] = bounds.split(",").map(Number);

    if ([west, south, east, north].some(isNaN)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid bounds format",
        },
        { status: 400 }
      );
    }

    const result = await RegionService.getTerritoriesInViewport(
      { west, south, east, north },
      parseInt(resolution || "11")
    );

    console.log("📤 Sending response:", {
      regionCount: result.regionIds.length,
      totalHexes: result.totalHexes,
      hasRegions: Object.keys(result.regions).length > 0,
    });

    return NextResponse.json({
      success: true,
      regions: result.regions,
      regionIds: result.regionIds,
      totalHexes: result.totalHexes,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Error getting viewport territories:", error);
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

