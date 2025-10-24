export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  speed?: number | null;
  heading?: number | null;
}

export class GeolocationService {
  private watchId: number | null = null;
  private callbacks: Set<(location: LocationData) => void> = new Set();

  /**
   * Start watching position
   */
  startTracking(callback: (location: LocationData) => void): void {
    this.callbacks.add(callback);

    if (this.watchId !== null) {
      return; // Already tracking
    }

    if (!navigator.geolocation) {
      throw new Error("Geolocation is not supported");
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          speed: position.coords.speed,
          heading: position.coords.heading,
        };

        this.callbacks.forEach((cb) => cb(locationData));
      },
      (error) => {
        console.error("Geolocation error:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );
  }

  /**
   * Stop watching position
   */
  stopTracking(callback?: (location: LocationData) => void): void {
    if (callback) {
      this.callbacks.delete(callback);
    }

    if (this.callbacks.size === 0 && this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Get current position once
   */
  async getCurrentPosition(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            speed: position.coords.speed,
            heading: position.coords.heading,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000,
        }
      );
    });
  }
}
