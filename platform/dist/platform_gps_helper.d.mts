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
    radius: number;
}
interface GPSOptions {
    useIPLocation?: boolean;
    ipServiceURL?: string;
    updateInterval?: number;
    accuracyThreshold?: number;
}
declare class GPSLocationHelper {
    private currentLocation;
    private options;
    private updateTimer;
    constructor(options?: GPSOptions);
    private startLocationUpdates;
    private updateLocation;
    private getIPBasedLocation;
    private getHardwareGPSLocation;
    private setMockLocation;
    getCurrentLocation(): Coordinates | null;
    isInZone(zone: LocationZone): boolean;
    private calculateDistance;
    private toRadians;
    setMockLocationForTesting(lat: number, lng: number): void;
    cleanup(): void;
}
declare function createGPSLocationTrigger(zone: LocationZone, options?: GPSOptions): () => boolean;
declare function gpsLocation(zone: LocationZone): () => boolean;
declare function getCurrentPosition(options?: GPSOptions): Promise<Coordinates | null>;
declare function calculateDistanceBetween(point1: {
    lat: number;
    lng: number;
}, point2: {
    lat: number;
    lng: number;
}): number;

export { type Coordinates, GPSLocationHelper, type GPSOptions, type LocationZone, calculateDistanceBetween, createGPSLocationTrigger, getCurrentPosition, gpsLocation };
