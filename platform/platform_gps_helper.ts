/**
 * GPS Location Helper
 * Supports both hardware GPS and IP-based geolocation
 * Requires: npm install node-fetch
 */

interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

interface LocationZone {
  lat: number;
  lng: number;
  radius: number; // meters
}

interface GPSOptions {
  useIPLocation?: boolean;
  ipServiceURL?: string;
  updateInterval?: number;
  accuracyThreshold?: number;
}

export class GPSLocationHelper {
  private currentLocation: Coordinates | null = null;
  // private _lastLocationTime: number = 0;
  private options: GPSOptions;
  private updateTimer: NodeJS.Timeout | null = null;

  constructor(options: GPSOptions = {}) {
    this.options = {
      useIPLocation: true,
      ipServiceURL: 'http://ip-api.com/json',
      updateInterval: 60000, // 1 minute
      accuracyThreshold: 100, // 100 meters
      ...options
    };

    this.startLocationUpdates();
  }

  private startLocationUpdates(): void {
    // Get initial location
    this.updateLocation();

    // Set up periodic updates
    this.updateTimer = setInterval(() => {
      this.updateLocation();
    }, this.options.updateInterval);

    // Cleanup on process exit
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
  }

  private async updateLocation(): Promise<void> {
    try {
      if (this.options.useIPLocation) {
        await this.getIPBasedLocation();
      } else {
        await this.getHardwareGPSLocation();
      }
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  }

  private async getIPBasedLocation(): Promise<void> {
    try {
      // Dynamic import for node-fetch compatibility
      const fetch = (await import('node-fetch')).default;
      
      const response = await fetch(this.options.ipServiceURL!);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as any;
      
      if (data.status === 'success' && data.lat && data.lon) {
        this.currentLocation = {
          lat: parseFloat(data.lat),
          lng: parseFloat(data.lon),
          accuracy: 10000, // IP location is typically city-level (10km accuracy)
          timestamp: Date.now()
        };
        
        // this._lastLocationTime = Date.now();
        console.log(`IP Location updated: ${this.currentLocation.lat}, ${this.currentLocation.lng}`);
      } else {
        throw new Error('Invalid response from IP location service');
      }
      
    } catch (error) {
      console.error('IP geolocation failed:', error);
      
      // Fallback to mock location for development
      this.setMockLocation();
    }
  }

  private async getHardwareGPSLocation(): Promise<void> {
    // Placeholder for hardware GPS implementation
    // This would integrate with actual GPS hardware/modules
    console.warn('Hardware GPS not implemented. Using mock location.');
    this.setMockLocation();
  }

  private setMockLocation(): void {
    // Default to a known location (New York City) for testing
    this.currentLocation = {
      lat: 40.7128,
      lng: -74.0060,
      accuracy: 50,
      timestamp: Date.now()
    };
    console.log('Using mock location: NYC');
  }

  public getCurrentLocation(): Coordinates | null {
    return this.currentLocation;
  }

  public isInZone(zone: LocationZone): boolean {
    if (!this.currentLocation) {
      console.warn('No location available for zone check');
      return false;
    }

    const distance = this.calculateDistance(
      this.currentLocation.lat,
      this.currentLocation.lng,
      zone.lat,
      zone.lng
    );

    const isInside = distance <= zone.radius;
    
    console.log(`Location check: ${distance.toFixed(2)}m from zone center (${zone.radius}m radius) - ${isInside ? 'INSIDE' : 'OUTSIDE'}`);
    
    return isInside;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    // Haversine formula for calculating distance between two points on Earth
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  public setMockLocationForTesting(lat: number, lng: number): void {
    this.currentLocation = {
      lat,
      lng,
      accuracy: 1,
      timestamp: Date.now()
    };
    console.log(`Mock location set: ${lat}, ${lng}`);
  }

  public cleanup(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }
}

// Factory function for creating GPS-based availability triggers
export function createGPSLocationTrigger(
  zone: LocationZone,
  options?: GPSOptions
): () => boolean {
  const gpsHelper = new GPSLocationHelper(options);

  return () => gpsHelper.isInZone(zone);
}

// Simpler interface matching the original helper
export function gpsLocation(zone: LocationZone): () => boolean {
  return createGPSLocationTrigger(zone, { useIPLocation: true });
}

// Utility functions
export async function getCurrentPosition(options?: GPSOptions): Promise<Coordinates | null> {
  const helper = new GPSLocationHelper(options);
  
  // Wait a moment for location to be obtained
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const location = helper.getCurrentLocation();
  helper.cleanup();
  
  return location;
}

export function calculateDistanceBetween(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const helper = new GPSLocationHelper();
  const distance = (helper as any).calculateDistance(
    point1.lat, point1.lng, point2.lat, point2.lng
  );
  helper.cleanup();
  return distance;
}

// Export types for external use
export type { Coordinates, LocationZone, GPSOptions };