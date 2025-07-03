# Platform Integrations Guide

PayuBLE provides platform-specific integrations to leverage hardware capabilities and system features for advanced availability triggers and authentication mechanisms.

## Table of Contents

- [GPIO Integration (Raspberry Pi)](#gpio-integration-raspberry-pi)
- [Network MAC Detection](#network-mac-detection)
- [GPS Location Services](#gps-location-services)
- [Platform Detection](#platform-detection)
- [Installation Requirements](#installation-requirements)
- [Configuration Examples](#configuration-examples)
- [Troubleshooting](#troubleshooting)

## GPIO Integration (Raspberry Pi)

### Overview

The GPIO integration allows PayuBLE devices to respond to physical button presses or switch states on Raspberry Pi and compatible single-board computers.

### Installation

```bash
npm install onoff
```

### Basic Usage

```typescript
import { gpioButton } from 'payu-ble/platform';

// Simple button on pin 18
const device = new PayuBLE('RPI_DEVICE_001');
device.setBLEAvailability(gpioButton(18));

// Device will only be available when button is pressed
if (device.isDeviceAvailable()) {
  const challenge = device.createChallenge({
    type: 'arithmetic',
    difficulty: 2
  });
}
```

### Advanced GPIO Configuration

```typescript
import { createGPIOButtonTrigger } from 'payu-ble/platform';

const advancedGPIOTrigger = createGPIOButtonTrigger(18, {
  edge: 'rising',        // Trigger on button press (not release)
  activeLow: true,       // Button pulls pin low when pressed
  debounceTimeout: 100   // 100ms debounce
});

device.setBLEAvailability(advancedGPIOTrigger);
```

### Multiple Button Logic

```typescript
import { GPIOButtonHelper } from 'payu-ble/platform';

const button1 = new GPIOButtonHelper({ pin: 18 });
const button2 = new GPIOButtonHelper({ pin: 19 });

// Device available only when both buttons pressed
device.setBLEAvailability(() => {
  return button1.isButtonPressed() && button2.isButtonPressed();
});

// Cleanup on exit
process.on('SIGINT', () => {
  button1.cleanup();
  button2.cleanup();
});
```

### GPIO with Security Sequence

```typescript
class SequenceButton {
  private sequence: number[] = [];
  private expectedSequence = [1, 2, 1, 3]; // Button sequence
  private timeout = 5000; // 5 seconds to complete sequence
  private lastPress = 0;

  constructor(private buttons: GPIOButtonHelper[]) {
    this.buttons.forEach((button, index) => {
      // Monitor button presses
      setInterval(() => {
        if (button.isButtonPressed() && !this.wasPressed[index]) {
          this.handleButtonPress(index + 1);
          this.wasPressed[index] = true;
        } else if (!button.isButtonPressed()) {
          this.wasPressed[index] = false;
        }
      }, 50);
    });
  }

  private wasPressed = [false, false, false];

  private handleButtonPress(buttonNumber: number) {
    const now = Date.now();
    
    // Reset if too much time passed
    if (now - this.lastPress > this.timeout) {
      this.sequence = [];
    }
    
    this.sequence.push(buttonNumber);
    this.lastPress = now;
    
    // Check if sequence is too long
    if (this.sequence.length > this.expectedSequence.length) {
      this.sequence = [];
    }
  }

  isSequenceComplete(): boolean {
    return this.sequence.length === this.expectedSequence.length &&
           this.sequence.every((val, i) => val === this.expectedSequence[i]);
  }
}
```

## Network MAC Detection

### Overview

Detect specific devices on the local network by their MAC addresses, useful for proximity-based authentication.

### Installation

```bash
npm install arp-a ping
```

### Basic Usage

```typescript
import { macOnNetwork } from 'payu-ble/platform';

// Device available when manager's laptop is on network
const managerLaptopMAC = 'AA:BB:CC:DD:EE:FF';
device.setBLEAvailability(macOnNetwork(managerLaptopMAC));
```

### Advanced Network Detection

```typescript
import { createMACNetworkTrigger, discoverLocalDevices } from 'payu-ble/platform';

// More sophisticated network detection
const networkTrigger = createMACNetworkTrigger('AA:BB:CC:DD:EE:FF', {
  scanSubnet: true,        // Ping subnet to populate ARP table
  timeout: 5000,           // 5 second timeout
  retries: 2               // Retry failed operations
});

device.setBLEAvailability(networkTrigger);

// Discover all devices on network
const discoveredDevices = await discoverLocalDevices();
console.log('Found devices:', discoveredDevices);
```

### Multiple Device Detection

```typescript
import { NetworkMACHelper } from 'payu-ble/platform';

const authorizedMACs = [
  'AA:BB:CC:DD:EE:FF', // Manager laptop
  '11:22:33:44:55:66', // Security tablet
  '77:88:99:AA:BB:CC'  // Authorized phone
];

const networkHelper = new NetworkMACHelper({
  scanSubnet: true,
  subnet: '192.168.1.0/24'
});

device.setBLEAvailability(async () => {
  for (const mac of authorizedMACs) {
    if (await networkHelper.scanForMAC(mac)) {
      return true; // Any authorized device found
    }
  }
  return false;
});
```

### Network-Based Challenges

```typescript
// Create challenges based on detected devices
device.setBLEAvailability(async () => {
  const discoveredMACs = await networkHelper.getAllDiscoveredMACs();
  
  if (discoveredMACs.length > 0) {
    // Create challenge showing discovered devices
    device.createChallenge({
      type: 'custom',
      formula: () => {
        const deviceList = discoveredMACs.slice(0, 3).join(', ');
        return `Security verification: How many devices detected? (${deviceList}...)`;
      },
      validate: (input) => parseInt(input) === discoveredMACs.length
    });
    
    return true;
  }
  
  return false;
});
```

## GPS Location Services

### Overview

Use GPS coordinates or IP-based geolocation to create location-aware availability triggers.

### Installation

```bash
npm install node-fetch
```

### Basic Usage

```typescript
import { gpsLocation } from 'payu-ble/platform';

// Device only available within 100m of office
const officeLocation = {
  lat: 40.7128,
  lng: -74.0060,
  radius: 100 // meters
};

device.setBLEAvailability(gpsLocation(officeLocation));
```

### IP-Based Geolocation

```typescript
import { createGPSLocationTrigger, getCurrentPosition } from 'payu-ble/platform';

// Use IP geolocation (city-level accuracy)
const locationTrigger = createGPSLocationTrigger(
  { lat: 40.7128, lng: -74.0060, radius: 10000 }, // 10km radius for city
  { useIPLocation: true }
);

device.setBLEAvailability(locationTrigger);

// Get current position
const position = await getCurrentPosition();
console.log('Current location:', position);
```

### Multiple Location Zones

```typescript
import { GPSLocationHelper } from 'payu-ble/platform';

const authorizedZones = [
  { lat: 40.7128, lng: -74.0060, radius: 500 }, // Main office
  { lat: 40.7589, lng: -73.9851, radius: 300 }, // Branch office
  { lat: 40.6782, lng: -73.9442, radius: 200 }  // Warehouse
];

const gpsHelper = new GPSLocationHelper({
  useIPLocation: true,
  updateInterval: 60000 // Update every minute
});

device.setBLEAvailability(() => {
  return authorizedZones.some(zone => gpsHelper.isInZone(zone));
});
```

### Location-Based Challenges

```typescript
// Create location-specific challenges
const gpsHelper = new GPSLocationHelper();

device.setBLEAvailability(() => {
  const location = gpsHelper.getCurrentLocation();
  
  if (location && gpsHelper.isInZone(officeLocation)) {
    // Create challenge based on current location
    device.createChallenge({
      type: 'custom',
      formula: () => 'What floor of the building are you on?',
      validate: (input) => {
        // In a real app, you might determine floor from GPS altitude
        // or integrate with building management systems
        const validFloors = ['1', '2', '3', 'first', 'second', 'third'];
        return validFloors.includes(input.toLowerCase());
      }
    });
    
    return true;
  }
  
  return false;
});
```

## Platform Detection

### Automatic Platform Detection

```typescript
import { getPlatformInfo, createPlatformHelpers } from 'payu-ble/platform';

const platform = getPlatformInfo();
console.log('Platform info:', platform);
// {
//   platform: 'linux',
//   arch: 'arm64',
//   node: 'v16.14.0',
//   hasGPIO: true,
//   capabilities: {
//     gpio: true,
//     networking: true,
//     gps: true,
//     ipGeolocation: true
//   }
// }

// Get platform-optimized helpers
const helpers = createPlatformHelpers();
device.setBLEAvailability(helpers.gpioButton(18)); // Uses GPIO on Pi, mock on others
```

### Conditional Feature Usage

```typescript
const platform = getPlatformInfo();

if (platform.hasGPIO) {
  // Use hardware button on Raspberry Pi
  device.setBLEAvailability(gpioButton(18));
} else {
  // Use time-based availability on other platforms
  device.setBLEAvailability(helpers.timeBased([9, 10, 11, 12, 13, 14, 15, 16, 17]));
}
```

## Installation Requirements

### Raspberry Pi Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install build tools for native modules
sudo apt-get install -y build-essential python3-dev

# Install PayuBLE with platform extensions
npm install payu-ble
npm install onoff arp-a ping node-fetch
```

### Linux/macOS Setup

```bash
# Install PayuBLE
npm install payu-ble

# Install optional platform dependencies
npm install arp-a ping node-fetch

# Note: GPIO functionality requires hardware support
```

### Windows Setup

```powershell
# Install PayuBLE
npm install payu-ble

# Install network detection tools
npm install ping node-fetch

# Note: ARP functionality may require admin privileges
```

## Configuration Examples

### IoT Gateway Configuration

```typescript
import PayuBLE from 'payu-ble';
import { gpioButton, macOnNetwork, gpsLocation } from 'payu-ble/platform';

const gatewayDevice = new PayuBLE('IOT_GATEWAY_001');

// Multi-factor availability trigger
gatewayDevice.setBLEAvailability(() => {
  const buttonPressed = gpioButton(18)();
  const adminPresent = macOnNetwork('AA:BB:CC:DD:EE:FF')();
  const inSecureLocation = gpsLocation({
    lat: 40.7128,
    lng: -74.0060,
    radius: 100
  })();
  
  // All conditions must be met
  return buttonPressed && adminPresent && inSecureLocation;
});
```

### Industrial Controller

```typescript
// Industrial machine with safety requirements
const machineController = new PayuBLE('MACHINE_CTRL_001');

const safetyButton = new GPIOButtonHelper({ pin: 18, activeLow: true });
const emergencyStop = new GPIOButtonHelper({ pin: 19, activeLow: true });

machineController.setBLEAvailability(() => {
  // Safety button must be pressed, emergency stop must NOT be pressed
  return safetyButton.isButtonPressed() && !emergencyStop.isButtonPressed();
});

// Create safety-aware challenges
if (machineController.isDeviceAvailable()) {
  machineController.createChallenge({
    type: 'custom',
    formula: () => 'Enter operator certification number:',
    validate: async (input) => {
      return await validateOperatorCertification(input);
    }
  });
}
```

### Smart Building Access

```typescript
const buildingAccess = new PayuBLE('BUILDING_ACCESS_001');

// Combine multiple factors
buildingAccess.setBLEAvailability(() => {
  const duringBusinessHours = helpers.timeBased([8, 9, 10, 11, 12, 13, 14, 15, 16, 17])();
  const securitySystemArmed = checkSecuritySystem();
  const inProximity = gpsLocation({
    lat: 40.7128,
    lng: -74.0060,
    radius: 50
  })();
  
  return duringBusinessHours && !securitySystemArmed && inProximity;
});
```

## Troubleshooting

### GPIO Issues

**Problem**: "Error: EACCES: permission denied"
```bash
# Solution: Add user to gpio group
sudo usermod -a -G gpio $USER
# Logout and login again
```

**Problem**: "GPIO not accessible"
```bash
# Solution: Enable GPIO interface
sudo raspi-config
# Navigate to Interface Options > GPIO > Enable
```

### Network Detection Issues

**Problem**: "Command not found: arp"
```bash
# Solution: Install network tools
sudo apt-get install net-tools
# or on newer systems:
sudo apt-get install iproute2
```

**Problem**: Empty ARP table
```bash
# Solution: Populate ARP table by pinging subnet
ping -c 1 192.168.1.1
# or use nmap:
nmap -sn 192.168.1.0/24
```

### GPS/Location Issues

**Problem**: "Fetch failed" for IP geolocation
```javascript
// Solution: Use alternative IP geolocation service
const gpsHelper = new GPSLocationHelper({
  useIPLocation: true,
  ipServiceURL: 'https://ipapi.co/json'
});
```

**Problem**: Inaccurate location
```javascript
// Solution: Increase radius for IP-based location
const zone = {
  lat: 40.7128,
  lng: -74.0060,
  radius: 10000 // 10km for city-level accuracy
};
```

### Platform Compatibility

**Problem**: "Module not found" on different platforms
```javascript
// Solution: Use conditional imports
let platformHelpers;
try {
  platformHelpers = require('payu-ble/platform');
} catch (error) {
  console.warn('Platform integrations not available:', error.message);
  platformHelpers = {
    gpioButton: () => () => false,
    macOnNetwork: () => () => false,
    gpsLocation: () => () => false
  };
}
```

## Best Practices

1. **Always handle platform differences gracefully**
2. **Implement fallback mechanisms for unavailable features**
3. **Use appropriate timeouts for network operations**
4. **Cache expensive operations (GPS, network scans)**
5. **Implement proper cleanup for GPIO resources**
6. **Test on target hardware early in development**
7. **Monitor system resources (CPU, memory) during operation**
8. **Use appropriate polling intervals to balance responsiveness and efficiency**
9. **Implement error recovery for transient failures**
10. **Document hardware requirements clearly**