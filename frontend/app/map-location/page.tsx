"use client";

import { useState, useEffect, useCallback } from "react";

export default function MapLocationPage() {
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [responseData, setResponseData] = useState<{latitude: number; longitude: number; timestamp?: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Make sendLocationToAPI available outside useEffect
  const sendLocationToAPI = useCallback(async (loc: { latitude: number; longitude: number }) => {
    // Store display location
    setCurrentLocation(loc);
    
    try {
      // Format location data to 6 decimal places (GPS precision)
      const locationData = {
        latitude: parseFloat(Number(loc.latitude).toFixed(6)),
        longitude: parseFloat(Number(loc.longitude).toFixed(6)),
      };

      console.log('=== SENDING LOCATION DATA ===');
      console.log('Original location:', loc);
      console.log('Formatted location data:', locationData);
      console.log('Type of latitude:', typeof locationData.latitude);
      console.log('Type of longitude:', typeof locationData.longitude);
      console.log('JSON:', JSON.stringify(locationData));

      const response = await fetch('/api/echo-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        setError(`API error: ${response.status} - ${errorText}`);
        return;
      }

      const data = await response.json();
      console.log('✅ API Response:', data);
      setResponseData(data);
    } catch (err) {
      console.error('❌ Failed to send location data:', err);
      setError(`Failed to send location data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Auto-fetch location on page load
    const getCurrentLocation = async () => {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          await sendLocationToAPI(loc);
        },
        (err) => {
          let errorMessage = 'Failed to get location: ';
          
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage += 'Permission denied';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage += 'Position unavailable';
              break;
            case err.TIMEOUT:
              errorMessage += 'Timeout';
              break;
            default:
              errorMessage += err.message;
              break;
          }
          
          setError(errorMessage);
          setLoading(false);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    };

    getCurrentLocation();
  }, [sendLocationToAPI]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-md mx-auto">
                    <h1 className="text-2xl font-bold text-foreground mb-6">
          Location API Test
        </h1>
        
        <div className="bg-white/5 rounded-lg p-6 space-y-4">
          {/* Current Location */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Your Location
            </h2>
            {currentLocation ? (
              <div className="text-sm space-y-1">
                <div className="text-muted-foreground">
                  Latitude: <span className="text-foreground">{currentLocation.latitude.toFixed(6)}</span>
                </div>
                <div className="text-muted-foreground">
                  Longitude: <span className="text-foreground">{currentLocation.longitude.toFixed(6)}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No location data
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center">
              <div className="text-lg text-blue-400 animate-pulse">Loading...</div>
            </div>
          )}
          
          {/* Error State */}
          {error && (
            <div className="text-center text-red-400">
              <div className="text-sm">{error}</div>
            </div>
          )}
          
                    {/* API Response */}
          {responseData && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                API Response
              </h2>
              <div className="bg-white/10 rounded p-3">
                <div className="text-sm text-muted-foreground">
                  <div>Latitude: <span className="text-foreground">{responseData.latitude}</span></div>
                  <div>Longitude: <span className="text-foreground">{responseData.longitude}</span></div>
                  {responseData.timestamp && (
                    <div className="text-xs mt-2">
                      Time: {new Date(responseData.timestamp).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <button 
            onClick={() => {
              if (!navigator.geolocation) {
                setError('Geolocation is not supported by your browser');
                return;
              }
              navigator.geolocation.getCurrentPosition(
                async (position) => {
                  await sendLocationToAPI({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                  });
                },
                (err) => {
                  setError('Failed to get location');
                  console.error(err);
                }
              );
            }}
            disabled={loading}
            className="w-full mt-4 px-4 py-2 bg-primary/80 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50"
          >
            {loading ? 'Getting Location...' : 'Get My Location'}
          </button>

        </div>
      </div>
    </div>
  );
}
