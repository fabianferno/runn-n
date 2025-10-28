import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongo';

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Return success response
    return NextResponse.json(
      { 
        message: 'MongoDB connected successfully!',
        timestamp: new Date().toISOString(),
        status: 'connected'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('MongoDB connection error:', error);
    
    return NextResponse.json(
      { 
        message: 'Failed to connect to MongoDB',
        error: error instanceof Error ? (error instanceof Error ? error.message : "Unknown error") : 'Unknown error',
        status: 'error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Parse request body
    const body = await request.json();
    
    // Return success response with received data
    return NextResponse.json(
      { 
        message: 'MongoDB connected successfully!',
        receivedData: body,
        timestamp: new Date().toISOString(),
        status: 'connected'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('MongoDB connection error:', error);
    
    return NextResponse.json(
      { 
        message: 'Failed to connect to MongoDB',
        error: error instanceof Error ? (error instanceof Error ? error.message : "Unknown error") : 'Unknown error',
        status: 'error'
      },
      { status: 500 }
    );
  }
}
