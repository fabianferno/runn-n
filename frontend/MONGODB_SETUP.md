# MongoDB Setup for Next.js

This project is now configured to use MongoDB with Mongoose for backend API routes.

## Environment Setup

1. Create a `.env.local` file in the frontend directory
2. Add your MongoDB connection string:

```env
MONGO_DB_URL=mongodb://localhost:27017/your-database-name
```

For MongoDB Atlas (cloud):
```env
MONGO_DB_URL=mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority
```

## Files Created

- `lib/mongo.ts` - MongoDB connection utility with caching
- `app/api/test-mongo/route.ts` - Test endpoint to verify MongoDB connection
- `app/api/users/route.ts` - Example CRUD API with User model

## Usage

### Basic Connection
```typescript
import connectDB from '@/lib/mongo';

export async function GET() {
  await connectDB();
  // Your database operations here
}
```

### Example API Routes

1. **Test Connection**: `GET /api/test-mongo`
2. **Users CRUD**: 
   - `GET /api/users` - Get all users
   - `POST /api/users` - Create a new user

### Example User Creation
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

## Features

- ✅ Connection caching to prevent multiple connections
- ✅ Environment variable validation
- ✅ TypeScript support
- ✅ Error handling
- ✅ Example CRUD operations
- ✅ Mongoose schema definition

## Next Steps

1. Set up your `.env.local` file with your MongoDB URL
2. Test the connection using `/api/test-mongo`
3. Create your own models and API routes following the pattern in `/api/users`
