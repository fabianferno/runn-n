import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import { UserModel } from "@/lib/models/user.model";
import { PathModel } from "@/lib/models/path.model";
import { QuestCompletionModel } from "@/lib/models/quest-completion.model";

// users
// {
//     "_id": "0xD9bdE6AB21D302427d6ABc3466E1fB991CAd6cFf",
//     "color": "#F0B27A",
//     "stats": {
//       "totalHexes": 0,
//       "totalRegions": 0,
//       "largestCapture": 0,
//       "totalCaptures": 0,
//       "lastActive": 1761479003374
//     },
//     "activeRegions": [],
//     "createdAt": 1761461533282,
//     "__v": 0
//   }

// regions
// {
//     "_id": "0xD9bdE6AB21D302427d6ABc3466E1fB991CAd6cFf",
//     "color": "#F0B27A",
//     "stats": {
//       "totalHexes": 0,
//       "totalRegions": 0,
//       "largestCapture": 0,
//       "totalCaptures": 0,
//       "lastActive": 1761479003374
//     },
//     "activeRegions": [],
//     "createdAt": 1761461533282,
//     "__v": 0
//   }

// quests
// {
//     "_id": {
//       "$oid": "68fd5466b6e9c5e8bc814036"
//     },
//     "questName": "Pothole ",
//     "questDescription": "Submit images of pothole for completing the quest",
//     "difficulty": "easy",
//     "coinName": "QuestCoin",
//     "coinSymbol": "QC",
//     "coinDescription": "Quest completion reward token",
//     "tokenURI": "https://ipfs.io/ipfs/QmQuestMetadata",
//     "creatorAllocationBps": 2000,
//     "contributorsAllocationBps": 5000,
//     "liquidityAllocationBps": 3000,
//     "creatorVestingDays": 365,
//     "lockAsset": "USDC",
//     "lockAmount": 5,
//     "chainName": "sepolia",
//     "creator": "0xD9bdE6AB21D302427d6ABc3466E1fB991CAd6cFf",
//     "dataCoinAddress": "0x1e3642D054b422B2eda7462daAbFD441e0Df960D",
//     "poolAddress": "0xF7316Df76D2Cbeb1DAB23456bB57672e552BB6ed",
//     "status": "active",
//     "createdAt": {
//       "$date": "2025-10-25T22:51:18.104Z"
//     },
//     "updatedAt": {
//       "$date": "2025-10-25T22:51:18.104Z"
//     },
//     "__v": 0
//   }

// questcompletions
// {
//     "_id": {
//       "$oid": "68fd5ac3b6e9c5e8bc814043"
//     },
//     "questId": "68fd5466b6e9c5e8bc814036",
//     "userId": "0xD9bdE6AB21D302427d6ABc3466E1fB991CAd6cFf",
//     "dataCoinAddress": "0x1e3642D054b422B2eda7462daAbFD441e0Df960D",
//     "mintAmount": 10,
//     "status": "minted",
//     "createdAt": {
//       "$date": "2025-10-25T23:18:27.791Z"
//     },
//     "updatedAt": {
//       "$date": "2025-10-25T23:19:18.568Z"
//     },
//     "__v": 0,
//     "mintedAt": {
//       "$date": "2025-10-25T23:19:18.566Z"
//     },
//     "transactionHash": "0x23e6060825694cf7983283a6670e971ef924de7c4fe71fd4ddd19c6b37eb7ff3"
//   }

// paths
// {
//     "_id": {
//       "$oid": "68fd4cca3f768d9494f9b279"
//     },
//     "user": "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
//     "type": "closed_loop",
//     "coordinates": [
//       [
//         13.05085128108165,
//         80.2815409753622
//       ],
//       [
//         13.051381250750937,
//         80.28167094065574
//       ],
//       [
//         13.051567566970855,
//         80.28157477556952
//       ],
//       [
//         13.051666968481586,
//         80.28160157025975
//       ],
//       [
//         13.051704879633032,
//         80.28145441307223
//       ],
//       [
//         13.05173813775209,
//         80.2815521440614
//       ],
//       [
//         13.05187979439815,
//         80.28158184681499
//       ],
//       [
//         13.052349647856692,
//         80.28144998750497
//       ],
//       [
//         13.052871954558709,
//         80.28135275774356
//       ],
//       [
//         13.05308253127494,
//         80.2814882110622
//       ],
//       [
//         13.053333738206483,
//         80.28137876557246
//       ],
//       [
//         13.05314447107522,
//         80.28130913133022
//       ],
//       [
//         13.052909191699445,
//         80.28130088633564
//       ],
//       [
//         13.05317359603868,
//         80.28137428789654
//       ],
//       [
//         13.053554715141901,
//         80.28129381433988
//       ],
//       [
//         13.053928391902232,
//         80.28140304358743
//       ],
//       [
//         13.054192410945124,
//         80.28127280790677
//       ],
//       [
//         13.05453232246621,
//         80.28125733784991
//       ],
//       [
//         13.054414101138269,
//         80.28118231869611
//       ],
//       [
//         13.054371053590788,
//         80.2810511305681
//       ],
//       [
//         13.054607613965679,
//         80.2809592478407
//       ],
//       [
//         13.054926571266465,
//         80.28099051063548
//       ],
//       [
//         13.054874049243875,
//         80.28108425807602
//       ],
//       [
//         13.055086632212953,
//         80.28119973742876
//       ],
//       [
//         13.054868015351163,
//         80.28121854960074
//       ],
//       [
//         13.055328952857193,
//         80.2811973016815
//       ],
//       [
//         13.055829306573164,
//         80.28121943838443
//       ],
//       [
//         13.055776937441868,
//         80.2811672879081
//       ],
//       [
//         13.055761377650189,
//         80.28112774768735
//       ],
//       [
//         13.055844121017905,
//         80.28120661582534
//       ],
//       [
//         13.055970914687983,
//         80.28131657527206
//       ],
//       [
//         13.056306209379521,
//         80.28143740490832
//       ],
//       [
//         13.05609462137219,
//         80.28135577226425
//       ],
//       [
//         13.056304452737498,
//         80.2812559307395
//       ],
//       [
//         13.056397782587778,
//         80.28116045891986
//       ],
//       [
//         13.056441497752028,
//         80.2811824814974
//       ],
//       [
//         13.056876900876171,
//         80.28129470818325
//       ],
//       [
//         13.056649169516284,
//         80.28141000412663
//       ],
//       [
//         13.05690261953669,
//         80.28145030263146
//       ],
//       [
//         13.057033559963134,
//         80.28145752465176
//       ],
//       [
//         13.057289897227273,
//         80.28157513250709
//       ],
//       [
//         13.057746410941323,
//         80.28160490619445
//       ],
//       [
//         13.0578071696994,
//         80.28152999580611
//       ],
//       [
//         13.057847940428122,
//         80.28160462303806
//       ],
//       [
//         13.057710159225465,
//         80.28147843982188
//       ],
//       [
//         13.057414677757508,
//         80.28153230792607
//       ],
//       [
//         13.057131100525783,
//         80.2815432151992
//       ],
//       [
//         13.057367904998728,
//         80.28144450367101
//       ],
//       [
//         13.057661465284415,
//         80.28143140926821
//       ],
//       [
//         13.057725447327368,
//         80.28139805165254
//       ],
//       [
//         13.057417785646487,
//         80.28141744109767
//       ],
//       [
//         13.057341172936146,
//         80.28139749012787
//       ],
//       [
//         13.057402555308954,
//         80.28144466026569
//       ],
//       [
//         13.057796357437864,
//         80.2815432826133
//       ],
//       [
//         13.057607476770862,
//         80.2814844857499
//       ],
//       [
//         13.057150906018592,
//         80.28146144960593
//       ],
//       [
//         13.057093527169496,
//         80.28138698863884
//       ],
//       [
//         13.057095483424115,
//         80.28138892889699
//       ],
//       [
//         13.05721360069396,
//         80.28125517560903
//       ],
//       [
//         13.05739327794891,
//         80.28137102405772
//       ],
//       [
//         13.05764955108295,
//         80.28129903046514
//       ],
//       [
//         13.057441690082534,
//         80.28142795833917
//       ],
//       [
//         13.057744195342623,
//         80.28139221934654
//       ],
//       [
//         13.057366848676878,
//         80.28145297622834
//       ],
//       [
//         13.057700347710709,
//         80.2813745702825
//       ],
//       [
//         13.057568466879603,
//         80.28128497867822
//       ],
//       [
//         13.057238757138894,
//         80.28146082748506
//       ],
//       [
//         13.057793742399655,
//         80.28157101647868
//       ],
//       [
//         13.057364388804073,
//         80.28175601870531
//       ],
//       [
//         13.057816727249136,
//         80.28176857410789
//       ],
//       [
//         13.057357588461773,
//         80.28186537445248
//       ],
//       [
//         13.057415997927514,
//         80.28174092363285
//       ],
//       [
//         13.057748526670334,
//         80.28168628127568
//       ],
//       [
//         13.057683161586496,
//         80.28162011343699
//       ],
//       [
//         13.057807223992649,
//         80.28170715315711
//       ],
//       [
//         13.057077001453676,
//         80.28191761570416
//       ],
//       [
//         13.056936993681907,
//         80.28192599622665
//       ],
//       [
//         13.057000930065634,
//         80.28205839292781
//       ],
//       [
//         13.057478972196586,
//         80.28209787006294
//       ],
//       [
//         13.056153433973599,
//         80.2819864911228
//       ],
//       [
//         13.054827895750611,
//         80.28187511218265
//       ],
//       [
//         13.053502357527625,
//         80.2817637332425
//       ],
//       [
//         13.052176819304638,
//         80.28165235430235
//       ],
//       [
//         13.05085128108165,
//         80.2815409753622
//       ]
//     ],
//     "hexPath": [
//       "8b618c48cb74fff",
//       "8b618c48cb2bfff",
//       "8b618c48cb0dfff",
//       "8b618c48cb0bfff",
//       "8b618c48ca24fff",
//       "8b618c48ca26fff",
//       "8b618c48ca20fff",
//       "8b618c48ca24fff",
//       "8b618c48ca26fff",
//       "8b618c48ca22fff",
//       "8b618c48ca31fff",
//       "8b618c48ca33fff",
//       "8b618c48ca06fff",
//       "8b618c48ca15fff",
//       "8b618c48ca10fff",
//       "8b618c48ca12fff",
//       "8b618c48caa1fff",
//       "8b618c48caa3fff",
//       "8b618c48ca84fff",
//       "8b618c48ca86fff",
//       "8b618c48ca84fff",
//       "8b618c48ca86fff",
//       "8b618c48ca84fff",
//       "8b618c48ca86fff",
//       "8b618c48ca84fff",
//       "8b618c48ca85fff",
//       "8b618c48ca80fff",
//       "8b618c48ca84fff",
//       "8b618c48ca86fff",
//       "8b618c48ca84fff",
//       "8b618c48ca80fff",
//       "8b618c48ca84fff",
//       "8b618c48ca86fff",
//       "8b618c48cab1fff",
//       "8b618c48ca86fff",
//       "8b618c48cab1fff",
//       "8b618c48ca86fff",
//       "8b618c48caa2fff",
//       "8b618c48cab1fff",
//       "8b618c48caa4fff",
//       "8b618c48ca32fff",
//       "8b618c48cb1bfff",
//       "8b618c48cb08fff",
//       "8b618c48cb74fff"
//     ],
//     "hexesCaptured": 15,
//     "boundaryHexes": 44,
//     "interiorHexes": -29,
//     "regionsAffected": [
//       "84618c5ffffffff"
//     ],
//     "conflicts": {},
//     "timestamp": 1761430730766,
//     "processingTime": 376,
//     "createdAt": {
//       "$date": "2025-10-25T22:18:50.774Z"
//     },
//     "updatedAt": {
//       "$date": "2025-10-25T22:18:50.774Z"
//     },
//     "__v": 0
//   }

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB();

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    // Aggregate users with all their stats
    const leaderboard = await UserModel.aggregate([
      {
        $lookup: {
          from: "paths",
          localField: "_id",
          foreignField: "user",
          as: "paths",
        },
      },
      {
        $lookup: {
          from: "questcompletions",
          localField: "_id",
          foreignField: "userId",
          as: "questCompletions",
        },
      },
      {
        $addFields: {
          totalPaths: { $size: "$paths" },
          totalQuestsCompleted: {
            $size: {
              $filter: {
                input: "$questCompletions",
                cond: { $eq: ["$$this.status", "minted"] },
              },
            },
          },
          averageHexesPerCapture: {
            $cond: {
              if: { $gt: ["$stats.totalCaptures", 0] },
              then: {
                $divide: ["$stats.totalHexes", "$stats.totalCaptures"],
              },
              else: 0,
            },
          },
          lastActiveFormatted: {
            $dateToString: {
              date: { $toDate: "$stats.lastActive" },
              format: "%Y-%m-%dT%H:%M:%S.%LZ",
            },
          },
          createdAtFormatted: {
            $dateToString: {
              date: { $toDate: "$createdAt" },
              format: "%Y-%m-%dT%H:%M:%S.%LZ",
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          color: 1,
          stats: 1,
          activeRegions: 1,
          totalPaths: 1,
          totalQuestsCompleted: 1,
          averageHexesPerCapture: 1,
          lastActiveFormatted: 1,
          createdAtFormatted: 1,
          // Include the count of active regions
          activeRegionsCount: { $size: "$activeRegions" },
        },
      },
      {
        $sort: { "stats.totalHexes": -1 }, // Sort by total territories captured
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);

    // Transform the data to include rank
    const leaderboardWithRank = leaderboard.map((user, index) => ({
      rank: skip + index + 1,
      userId: user._id,
      color: user.color,
      stats: {
        ...user.stats,
        lastActive: user.lastActiveFormatted,
      },
      activeRegions: user.activeRegions,
      activeRegionsCount: user.activeRegionsCount,
      totalPaths: user.totalPaths,
      totalQuestsCompleted: user.totalQuestsCompleted,
      averageHexesPerCapture: Number(user.averageHexesPerCapture.toFixed(2)),
      createdAt: user.createdAtFormatted,
    }));

    // Get total count for pagination
    const totalUsers = await UserModel.countDocuments();

    return NextResponse.json(
      {
        success: true,
        data: {
          leaderboard: leaderboardWithRank,
          pagination: {
            total: totalUsers,
            limit,
            skip,
            hasMore: skip + limit < totalUsers,
          },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Leaderboard fetch error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch leaderboard",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "userId is required",
        },
        { status: 400 }
      );
    }

    // Get user's detailed stats including their rank
    const userRankResult = await UserModel.aggregate([
      {
        $setWindowFields: {
          partitionBy: null,
          sortBy: { "stats.totalHexes": -1 },
          output: {
            rank: {
              $rank: {},
            },
          },
        },
      },
      {
        $match: { _id: userId },
      },
      {
        $limit: 1,
      },
      {
        $lookup: {
          from: "paths",
          localField: "_id",
          foreignField: "user",
          as: "paths",
        },
      },
      {
        $lookup: {
          from: "questcompletions",
          localField: "_id",
          foreignField: "userId",
          as: "questCompletions",
        },
      },
      {
        $addFields: {
          totalPaths: { $size: "$paths" },
          totalQuestsCompleted: {
            $size: {
              $filter: {
                input: "$questCompletions",
                cond: { $eq: ["$$this.status", "minted"] },
              },
            },
          },
        },
      },
    ]);

    if (userRankResult.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    const user = userRankResult[0];

    return NextResponse.json(
      {
        success: true,
        data: {
          rank: user.rank,
          userId: user._id,
          color: user.color,
          stats: user.stats,
          activeRegions: user.activeRegions,
          activeRegionsCount: user.activeRegions.length,
          totalPaths: user.totalPaths,
          totalQuestsCompleted: user.totalQuestsCompleted,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("User rank fetch error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch user rank",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
