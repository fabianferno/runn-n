import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import { RegionService } from "@/lib/services/region.service";

export async function GET(
  request: NextRequest,
  { params }: { params: { regionId: string } }
) {
  try {
    await connectDB();
    
    const { regionId } = params;
    const region = await RegionService.getRegion(regionId);

    if (!region) {
      return NextResponse.json(
        {
          success: false,
          error: "Region not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      regionId: region._id,
      territories: region.territories,
      metadata: region.metadata,
    });
  } catch (error: any) {
    console.error("Error getting region:", error);
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

