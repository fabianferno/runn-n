import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongo';
import mongoose from 'mongoose';

// Define User schema
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create model (or use existing if already created)
const User = mongoose.models.User || mongoose.model('User', UserSchema);

// GET /api/users - Get all users
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const users = await User.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json(
      { 
        users,
        count: users.length,
        message: 'Users retrieved successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching users:', error);
    
    return NextResponse.json(
      { 
        message: 'Failed to fetch users',
        error: error instanceof Error ? (error instanceof Error ? error.message : "Unknown error") : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { name, email } = body;
    
    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { message: 'Name and email are required' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    // Create new user
    const user = new User({ name, email });
    await user.save();
    
    return NextResponse.json(
      { 
        user,
        message: 'User created successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    
    return NextResponse.json(
      { 
        message: 'Failed to create user',
        error: error instanceof Error ? (error instanceof Error ? error.message : "Unknown error") : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
