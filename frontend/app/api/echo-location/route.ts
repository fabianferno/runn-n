import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('=== API RECEIVED DATA ===');
    console.log('Raw body:', body);
    console.log('Type of latitude:', typeof body.latitude);
    console.log('Type of longitude:', typeof body.longitude);
    console.log('Latitude value:', body.latitude);
    console.log('Longitude value:', body.longitude);
    
    const { latitude, longitude } = body;

    // Validate data
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      console.log('❌ Validation failed - invalid types');
      return NextResponse.json(
        { error: 'Invalid location data' },
        { status: 400 }
      );
    }

    // Round to 6 decimal places (GPS precision) and echo back
    const echoData = {
      latitude: parseFloat(latitude.toFixed(6)),
      longitude: parseFloat(longitude.toFixed(6)),
    };

    console.log('✅ Location Echo:', echoData);
    return NextResponse.json(echoData);
  } catch (error) {
    console.error('❌ Error echoing location:', error);
    return NextResponse.json(
      { error: 'Failed to process location data' },
      { status: 500 }
    );
  }
}
