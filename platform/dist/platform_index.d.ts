export { GPIOButtonHelper, createGPIOButtonTrigger, gpioButton } from './platform_gpio_helper.js';
export { NetworkMACHelper, createMACNetworkTrigger, discoverLocalDevices, isDeviceOnNetwork, macOnNetwork } from './platform_network_helper.js';
export { Coordinates, GPSLocationHelper, GPSOptions, LocationZone, calculateDistanceBetween, createGPSLocationTrigger, getCurrentPosition, gpsLocation } from './platform_gps_helper.js';

/**
 * Platform Integrations for PayuBLE
 *
 * This module provides native platform integrations for advanced
 * availability triggers and hardware-specific functionality.
 */

declare function getPlatformInfo(): {
    platform: NodeJS.Platform;
    arch: NodeJS.Architecture;
    node: string;
    hasGPIO: boolean;
    capabilities: {
        gpio: boolean;
        networking: boolean;
        gps: boolean;
        ipGeolocation: boolean;
    };
};
declare function createPlatformHelpers(): {
    gpioButton: (pin: number) => () => boolean;
    macOnNetwork: (mac: string) => () => boolean;
    gpsLocation: (zone: any) => () => boolean;
    platform: {
        platform: NodeJS.Platform;
        arch: NodeJS.Architecture;
        node: string;
        hasGPIO: boolean;
        capabilities: {
            gpio: boolean;
            networking: boolean;
            gps: boolean;
            ipGeolocation: boolean;
        };
    };
};
declare function updateCoreHelpers(coreHelpers: any): any;

export { createPlatformHelpers, getPlatformInfo, updateCoreHelpers };
