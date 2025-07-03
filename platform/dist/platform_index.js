"use strict";
/**
 * Platform Integrations for PayuBLE
 *
 * This module provides native platform integrations for advanced
 * availability triggers and hardware-specific functionality.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDistanceBetween = exports.getCurrentPosition = exports.gpsLocation = exports.createGPSLocationTrigger = exports.GPSLocationHelper = exports.isDeviceOnNetwork = exports.discoverLocalDevices = exports.macOnNetwork = exports.createMACNetworkTrigger = exports.NetworkMACHelper = exports.gpioButton = exports.createGPIOButtonTrigger = exports.GPIOButtonHelper = void 0;
exports.getPlatformInfo = getPlatformInfo;
exports.createPlatformHelpers = createPlatformHelpers;
exports.updateCoreHelpers = updateCoreHelpers;
// GPIO Integration (Raspberry Pi)
const platform_gpio_helper_1 = require("./platform_gpio_helper");
Object.defineProperty(exports, "GPIOButtonHelper", { enumerable: true, get: function () { return platform_gpio_helper_1.GPIOButtonHelper; } });
Object.defineProperty(exports, "createGPIOButtonTrigger", { enumerable: true, get: function () { return platform_gpio_helper_1.createGPIOButtonTrigger; } });
Object.defineProperty(exports, "gpioButton", { enumerable: true, get: function () { return platform_gpio_helper_1.gpioButton; } });
// Network MAC Detection
const platform_network_helper_1 = require("./platform_network_helper");
Object.defineProperty(exports, "NetworkMACHelper", { enumerable: true, get: function () { return platform_network_helper_1.NetworkMACHelper; } });
Object.defineProperty(exports, "createMACNetworkTrigger", { enumerable: true, get: function () { return platform_network_helper_1.createMACNetworkTrigger; } });
Object.defineProperty(exports, "macOnNetwork", { enumerable: true, get: function () { return platform_network_helper_1.macOnNetwork; } });
Object.defineProperty(exports, "discoverLocalDevices", { enumerable: true, get: function () { return platform_network_helper_1.discoverLocalDevices; } });
Object.defineProperty(exports, "isDeviceOnNetwork", { enumerable: true, get: function () { return platform_network_helper_1.isDeviceOnNetwork; } });
// GPS Location Services
const platform_gps_helper_1 = require("./platform_gps_helper");
Object.defineProperty(exports, "GPSLocationHelper", { enumerable: true, get: function () { return platform_gps_helper_1.GPSLocationHelper; } });
Object.defineProperty(exports, "createGPSLocationTrigger", { enumerable: true, get: function () { return platform_gps_helper_1.createGPSLocationTrigger; } });
Object.defineProperty(exports, "gpsLocation", { enumerable: true, get: function () { return platform_gps_helper_1.gpsLocation; } });
Object.defineProperty(exports, "getCurrentPosition", { enumerable: true, get: function () { return platform_gps_helper_1.getCurrentPosition; } });
Object.defineProperty(exports, "calculateDistanceBetween", { enumerable: true, get: function () { return platform_gps_helper_1.calculateDistanceBetween; } });
// Platform detection utilities
function getPlatformInfo() {
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
function createPlatformHelpers() {
    const platformInfo = getPlatformInfo();
    return {
        // Enhanced GPIO helper with platform detection
        gpioButton: platformInfo.hasGPIO
            ? (pin) => (0, platform_gpio_helper_1.gpioButton)(pin)
            : (_pin) => {
                console.warn(`GPIO not available on ${platformInfo.platform}/${platformInfo.arch}. Using mock.`);
                return () => false;
            },
        // Network scanning with platform optimization
        macOnNetwork: (mac) => (0, platform_network_helper_1.macOnNetwork)(mac),
        // GPS with automatic fallback
        gpsLocation: (zone) => (0, platform_gps_helper_1.gpsLocation)(zone),
        // Platform info
        platform: platformInfo
    };
}
// Easy import for updating core helpers
function updateCoreHelpers(coreHelpers) {
    const platformHelpers = createPlatformHelpers();
    return {
        ...coreHelpers,
        gpioButton: platformHelpers.gpioButton,
        macOnNetwork: platformHelpers.macOnNetwork,
        gpsLocation: platformHelpers.gpsLocation
    };
}
//# sourceMappingURL=platform_index.js.map