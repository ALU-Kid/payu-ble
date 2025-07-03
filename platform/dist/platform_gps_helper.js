"use strict";
/**
 * GPS Location Helper
 * Supports both hardware GPS and IP-based geolocation
 * Requires: npm install node-fetch
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GPSLocationHelper = void 0;
exports.createGPSLocationTrigger = createGPSLocationTrigger;
exports.gpsLocation = gpsLocation;
exports.getCurrentPosition = getCurrentPosition;
exports.calculateDistanceBetween = calculateDistanceBetween;
class GPSLocationHelper {
    constructor(options = {}) {
        this.currentLocation = null;
        this.updateTimer = null;
        this.options = {
            useIPLocation: true,
            ipServiceURL: 'http://ip-api.com/json',
            updateInterval: 60000, // 1 minute
            accuracyThreshold: 100, // 100 meters
            ...options
        };
        this.startLocationUpdates();
    }
    startLocationUpdates() {
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
    async updateLocation() {
        try {
            if (this.options.useIPLocation) {
                await this.getIPBasedLocation();
            }
            else {
                await this.getHardwareGPSLocation();
            }
        }
        catch (error) {
            console.error('Failed to update location:', error);
        }
    }
    async getIPBasedLocation() {
        try {
            // Dynamic import for node-fetch compatibility
            const fetch = (await Promise.resolve().then(() => __importStar(require('node-fetch')))).default;
            const response = await fetch(this.options.ipServiceURL);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.status === 'success' && data.lat && data.lon) {
                this.currentLocation = {
                    lat: parseFloat(data.lat),
                    lng: parseFloat(data.lon),
                    accuracy: 10000, // IP location is typically city-level (10km accuracy)
                    timestamp: Date.now()
                };
                // this._lastLocationTime = Date.now();
                console.log(`IP Location updated: ${this.currentLocation.lat}, ${this.currentLocation.lng}`);
            }
            else {
                throw new Error('Invalid response from IP location service');
            }
        }
        catch (error) {
            console.error('IP geolocation failed:', error);
            // Fallback to mock location for development
            this.setMockLocation();
        }
    }
    async getHardwareGPSLocation() {
        // Placeholder for hardware GPS implementation
        // This would integrate with actual GPS hardware/modules
        console.warn('Hardware GPS not implemented. Using mock location.');
        this.setMockLocation();
    }
    setMockLocation() {
        // Default to a known location (New York City) for testing
        this.currentLocation = {
            lat: 40.7128,
            lng: -74.0060,
            accuracy: 50,
            timestamp: Date.now()
        };
        console.log('Using mock location: NYC');
    }
    getCurrentLocation() {
        return this.currentLocation;
    }
    isInZone(zone) {
        if (!this.currentLocation) {
            console.warn('No location available for zone check');
            return false;
        }
        const distance = this.calculateDistance(this.currentLocation.lat, this.currentLocation.lng, zone.lat, zone.lng);
        const isInside = distance <= zone.radius;
        console.log(`Location check: ${distance.toFixed(2)}m from zone center (${zone.radius}m radius) - ${isInside ? 'INSIDE' : 'OUTSIDE'}`);
        return isInside;
    }
    calculateDistance(lat1, lng1, lat2, lng2) {
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
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    setMockLocationForTesting(lat, lng) {
        this.currentLocation = {
            lat,
            lng,
            accuracy: 1,
            timestamp: Date.now()
        };
        console.log(`Mock location set: ${lat}, ${lng}`);
    }
    cleanup() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }
}
exports.GPSLocationHelper = GPSLocationHelper;
// Factory function for creating GPS-based availability triggers
function createGPSLocationTrigger(zone, options) {
    const gpsHelper = new GPSLocationHelper(options);
    return () => gpsHelper.isInZone(zone);
}
// Simpler interface matching the original helper
function gpsLocation(zone) {
    return createGPSLocationTrigger(zone, { useIPLocation: true });
}
// Utility functions
async function getCurrentPosition(options) {
    const helper = new GPSLocationHelper(options);
    // Wait a moment for location to be obtained
    await new Promise(resolve => setTimeout(resolve, 2000));
    const location = helper.getCurrentLocation();
    helper.cleanup();
    return location;
}
function calculateDistanceBetween(point1, point2) {
    const helper = new GPSLocationHelper();
    const distance = helper.calculateDistance(point1.lat, point1.lng, point2.lat, point2.lng);
    helper.cleanup();
    return distance;
}
//# sourceMappingURL=platform_gps_helper.js.map