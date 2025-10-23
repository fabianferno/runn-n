import { NextResponse } from 'next/server';

export async function GET() {
  // Hardcoded random coordinates for testing
  const testLocations = [
    { latitude: 37.7749, longitude: -122.4194 }, // San Francisco
    { latitude: 40.7128, longitude: -74.0060 },   // New York
    { latitude: 34.0522, longitude: -118.2437 },  // Los Angeles
    { latitude: 41.8781, longitude: -87.6298 },   // Chicago
    { latitude: 25.7617, longitude: -80.1918 },  // Miami
    { latitude: 47.6062, longitude: -122.3321 },  // Seattle
    { latitude: 39.7392, longitude: -104.9903 },  // Denver
    { latitude: 33.4484, longitude: -112.0740 },  // Phoenix
  ];

  // Pick a random location
  const randomLocation = testLocations[Math.floor(Math.random() * testLocations.length)];

  return NextResponse.json({
    latitude: randomLocation.latitude,
    longitude: randomLocation.longitude,
  });
}
