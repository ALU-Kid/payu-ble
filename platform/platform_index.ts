/**
 * Platform Integrations for PayuBLE
 * 
 * This module provides native platform integrations for advanced
 * availability triggers and hardware-specific functionality.
 */

// GPIO Integration (Raspberry Pi)
import {
  GPIOButtonHelper,
  createGPIOButtonTrigger,
  gpioButton
} from './platform_gpio_helper';

// Network MAC Detection
import {
  NetworkMACHelper,
  createMACNetworkTrigger,
  macOnNetwork,
  discoverLocalDevices,
  isDeviceOnNetwork
} from './platform_network_helper';

// GPS Location Services
import {
  GPSLocationHelper,
  createGPSLocationTrigger,
  gpsLocation,
  getCurrentPosition,
  calculateDistanceBetween,
  type Coordinates,
  type LocationZone,
  type GPSOptions
} from './platform_gps_helper';

// Re-export everything
export {
  GPIOButtonHelper,
  createGPIOButtonTrigger,
  gpioButton,
  NetworkMACHelper,
  createMACNetworkTrigger,
  macOnNetwork,
  discoverLocalDevices,
  isDeviceOnNetwork,
  GPSLocationHelper,
  createGPSLocationTrigger,
  gpsLocation,
  getCurrentPosition,
  calculateDistanceBetween,
  type Coordinates,
  type LocationZone,
  type GPSOptions
};

// Platform detection utilities
export function getPlatformInfo() {
  return {
    platform: process.platform,
    arch: process.arch,
    node: process.version,
    hasGPIO: process.platform === 'linux' && (process.arch === 'arm' || process.arch === 'arm64'),
    capabilities: {
      gpio: process.platform === 'linux',
      networking: true,
      gps: true,
      ipGeolocation: true
    }
  };
}

// Platform-specific helper selection
export function createPlatformHelpers() {
  const platformInfo = getPlatformInfo();
  
  return {
    // Enhanced GPIO helper with platform detection
    gpioButton: platformInfo.hasGPIO 
      ? (pin: number) => gpioButton(pin)
      : (_pin: number) => {
          console.warn(`GPIO not available on ${platformInfo.platform}/${platformInfo.arch}. Using mock.`);
          return () => false;
        },
    
    // Network scanning with platform optimization
    macOnNetwork: (mac: string) => macOnNetwork(mac),
    
    // GPS with automatic fallback
    gpsLocation: (zone: any) => gpsLocation(zone),
    
    // Platform info
    platform: platformInfo
  };
}

// Easy import for updating core helpers
export function updateCoreHelpers(coreHelpers: any) {
  const platformHelpers = createPlatformHelpers();
  
  return {
    ...coreHelpers,
    gpioButton: platformHelpers.gpioButton,
    macOnNetwork: platformHelpers.macOnNetwork,
    gpsLocation: platformHelpers.gpsLocation
  };
}