"use client";

import { useState, useCallback, useEffect } from "react";

export default function MapLocationPage() {
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Function to get user location and send to httpbin
  const getAndSendLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }
      
      console.log('=== GETTING USER LOCATION ===');
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          
          console.log('User location:', { latitude, longitude });
          
          // Set current location for display
          setCurrentLocation({ latitude, longitude });
          
          try {
            console.log('=== SENDING TO HTTPBIN ===');
            
            // Send location to httpbin as query parameters
            const httpbinUrl = `https://httpbin.org/get?lat=${latitude}&lon=${longitude}`;
            const response = await fetch(httpbinUrl);
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Httpbin Response:', data);
            
            // Set response data with latitude and longitude
            setResponseData({
              latitude: latitude,
              longitude: longitude,
              httpbinResponse: data,
            });
          } catch (fetchErr) {
            console.error('❌ Failed to send to httpbin:', fetchErr);
            setError(`Failed to send to httpbin: ${fetchErr instanceof Error ? fetchErr.message : 'Unknown error'}`);
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          let errorMessage = 'Failed to get location: ';
          
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage += 'Permission denied by user';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage += 'Position information unavailable';
              break;
            case err.TIMEOUT:
              errorMessage += 'Location request timeout';
              break;
            default:
              errorMessage += err.message;
              break;
          }
          
          setError(errorMessage);
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } catch (err) {
      console.error('❌ Failed to get location:', err);
      setError(`Failed to get location: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  }, []);

  // Auto-fetch location on page load
  useEffect(() => {
    getAndSendLocation();
  }, [getAndSendLocation]);



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
                  <div>Latitude: <span className="text-foreground font-mono">{responseData.latitude}</span></div>
                  <div>Longitude: <span className="text-foreground font-mono">{responseData.longitude}</span></div>
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
            onClick={getAndSendLocation}
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
