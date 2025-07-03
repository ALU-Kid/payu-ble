/**
 * Platform Integrations for PayuBLE
 *
 * This module provides native platform integrations for advanced
 * availability triggers and hardware-specific functionality.
 */
import { GPIOButtonHelper, createGPIOButtonTrigger, gpioButton } from './platform_gpio_helper';
import { NetworkMACHelper, createMACNetworkTrigger, macOnNetwork, discoverLocalDevices, isDeviceOnNetwork } from './platform_network_helper';
import { GPSLocationHelper, createGPSLocationTrigger, gpsLocation, getCurrentPosition, calculateDistanceBetween, type Coordinates, type LocationZone, type GPSOptions } from './platform_gps_helper';
export { GPIOButtonHelper, createGPIOButtonTrigger, gpioButton, NetworkMACHelper, createMACNetworkTrigger, macOnNetwork, discoverLocalDevices, isDeviceOnNetwork, GPSLocationHelper, createGPSLocationTrigger, gpsLocation, getCurrentPosition, calculateDistanceBetween, type Coordinates, type LocationZone, type GPSOptions };
export declare function getPlatformInfo(): {
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
export declare function createPlatformHelpers(): {
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
export declare function updateCoreHelpers(coreHelpers: any): any;
//# sourceMappingURL=platform_index.d.ts.map