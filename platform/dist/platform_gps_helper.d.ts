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
export declare class GPSLocationHelper {
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
export declare function createGPSLocationTrigger(zone: LocationZone, options?: GPSOptions): () => boolean;
export declare function gpsLocation(zone: LocationZone): () => boolean;
export declare function getCurrentPosition(options?: GPSOptions): Promise<Coordinates | null>;
export declare function calculateDistanceBetween(point1: {
    lat: number;
    lng: number;
}, point2: {
    lat: number;
    lng: number;
}): number;
export type { Coordinates, LocationZone, GPSOptions };
//# sourceMappingURL=platform_gps_helper.d.ts.map