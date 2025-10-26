import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import { UserService } from "@/lib/services/user.service";

/**
 * POST /api/users/auth
 * Create or authenticate user with wallet address
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json(
        {
          success: false,
          error: "Wallet address is required",
        },
        { status: 400 }
      );
    }

    // Validate wallet address format (basic check)
    if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid wallet address format",
        },
        { status: 400 }
      );
    }

    const user = await UserService.createOrGetUser(walletAddress);

    return NextResponse.json({
      success: true,
      user,
      message: user.stats.totalCaptures === 0 ? "New user created" : "User authenticated",
    });
  } catch (error: any) {
    console.error("Error authenticating user:", error);
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

