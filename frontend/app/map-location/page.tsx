"use client";

import { useState, useEffect } from "react";

export default function MapLocationPage() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRandomLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/random-location');
      const data = await response.json();
      setLocation(data);
    } catch (err) {
      setError('Failed to fetch location');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomLocation();
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          Random Location
        </h1>
        
        <div className="bg-white/5 rounded-lg p-6">
          {loading && (
            <div className="text-center">
              <div className="text-lg">Loading...</div>
            </div>
          )}
          
          {error && (
            <div className="text-center text-red-400">
              <div className="text-lg">{error}</div>
            </div>
          )}
          
          {location && (
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground mb-2">
                Random Location
              </div>
              <div className="text-sm text-muted-foreground">
                Latitude: {location.latitude}
              </div>
              <div className="text-sm text-muted-foreground">
                Longitude: {location.longitude}
              </div>
            </div>
          )}
          
          <button
            onClick={fetchRandomLocation}
            disabled={loading}
            className="w-full mt-4 px-4 py-2 bg-primary/80 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50"
          >
            {loading ? "Loading..." : "Get New Random Location"}
          </button>
        </div>
      </div>
    </div>
  );
}
