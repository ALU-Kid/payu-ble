# payu-ble 🔐

A flexible, smart Bluetooth Low Energy (BLE) challenge system that allows developers to secure BLE connections using customizable challenges like math problems, riddles, hash puzzles, and custom validators.

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support%20Development-orange?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white)](https://www.buymeacoffee.com/rwesa)

## Features

- 🔐 **Secure BLE connections** with dynamic challenges
- 🧮 **Built-in challenge types**: arithmetic, hash-based, and custom
- ⚡ **Lightweight and modular** design
- 🔧 **Fully configurable** and extendable
- 📱 **Framework-agnostic** - works with any JavaScript/TypeScript project
- ⏰ **Time-based availability** controls
- 🎯 **Helper utilities** for common use cases

## Installation

```bash
npm install @rwesa/payu-ble
```

## Quick Start

### ES Modules (ESM) - Recommended
```typescript
import { createChallenge, verifyAnswer, setBLEAvailability, helpers } from '@rwesa/payu-ble';
// or
import PayuBLE, { createChallenge, helpers } from '@rwesa/payu-ble';

// Create a math challenge
const challenge = createChallenge({
  type: 'arithmetic',
  difficulty: 2
});

console.log(challenge.prompt); // "Solve: 15 + 7 × 3"

// Verify an answer
const isCorrect = verifyAnswer('36'); // true

// Set device availability (only available during business hours)
setBLEAvailability(helpers.timeBased([9, 10, 11, 12, 13, 14, 15, 16, 17]));
```

### CommonJS (CJS) - Legacy Support
```javascript
const { createChallenge, verifyAnswer, setBLEAvailability, helpers } = require('@rwesa/payu-ble');
// or
const PayuBLE = require('@rwesa/payu-ble').default;

// Same usage as above...
```

## Challenge Types

### Arithmetic Challenges

Create math problems with varying difficulty levels:

```typescript
// Easy: simple addition/subtraction
createChallenge({
  type: 'arithmetic',
  difficulty: 1  // 5 + 3
});

// Medium: includes multiplication
createChallenge({
  type: 'arithmetic',
  difficulty: 2  // 12 × 4
});

// Hard: order of operations
createChallenge({
  type: 'arithmetic',
  difficulty: 3  // 25 + 6 × 8
});

// Expert: complex expressions
createChallenge({
  type: 'arithmetic',
  difficulty: 4  // (75 + 15) × 12 - 8
});
```

### Hash-Based Challenges

Create cryptographic puzzles based on device ID and timestamp:

```typescript
createChallenge({
  type: 'hash'
});
// Generates: "What is (SHA256("device123456781640995200")) % 100?"
```

### Custom Challenges

Create riddles, word puzzles, or any custom validation:

```typescript
// Riddle with multiple valid answers
createChallenge({
  type: 'custom',
  formula: () => "What has keys but can't open locks?",
  validAnswers: ['piano', 'a piano', 'keyboard'],
  caseInsensitive: true
});

// Custom validation logic
createChallenge({
  type: 'custom',
  formula: () => "Enter the current year:",
  validate: (input) => parseInt(input) === new Date().getFullYear()
});

// Time-sensitive challenge
createChallenge({
  type: 'custom',
  formula: () => {
    const code = Math.floor(Date.now() / 60000) % 1000; // Changes every minute
    return `Enter code: ${code.toString().padStart(3, '0')}`;
  },
  validate: (input) => {
    const expectedCode = Math.floor(Date.now() / 60000) % 1000;
    return input === expectedCode.toString().padStart(3, '0');
  },
  ttl: 60000 // 1 minute expiry
});
```

## Availability Controls

Control when your BLE device advertises itself:

```typescript
import { setBLEAvailability, helpers } from 'payu-ble';

// Only available during specific hours
setBLEAvailability(helpers.timeBased([9, 10, 11, 14, 15, 16]));

// Available during scheduled time slots
setBLEAvailability(helpers.scheduleBasedAvailability([
  { start: '09:00', end: '12:00' },
  { start: '14:00', end: '17:00' }
]));

// Always available
setBLEAvailability(helpers.alwaysAvailable());

// Custom availability logic
setBLEAvailability(() => {
  const now = new Date();
  return now.getDay() >= 1 && now.getDay() <= 5; // Weekdays only
});
```

## Device Identity

The `getHardwareDeviceId()` helper provides a consistent, unique device identifier that persists across application restarts. This is particularly useful for incorporating device-specific data into challenges and ensuring consistent behavior.

### ESM Usage
```typescript
import { getHardwareDeviceId } from '@rwesa/payu-ble';

// Get consistent device ID
const deviceId = getHardwareDeviceId();
console.log(deviceId); // "a1b2c3d4e5f6a7b8"

// Use in arithmetic formulas
const challenge = createChallenge({
  type: 'custom',
  formula: () => {
    const id = getHardwareDeviceId();
    const numericId = parseInt(id.substring(0, 8), 16) % 1000;
    return `Calculate: ${numericId} + 42`;
  },
  validate: (input) => {
    const id = getHardwareDeviceId();
    const numericId = parseInt(id.substring(0, 8), 16) % 1000;
    return parseInt(input) === numericId + 42;
  }
});
```

### CommonJS Usage
```javascript
const { getHardwareDeviceId } = require('@rwesa/payu-ble');

// Get consistent device ID
const deviceId = getHardwareDeviceId();

// Strip characters for formulas
const numericId = deviceId.replace(/[^0-9]/g, '').substring(0, 6);
console.log(numericId); // "123456" (numbers only)
```

### Platform Compatibility

The helper automatically detects hardware IDs using platform-specific methods:

- **Linux**: Uses `/etc/machine-id` or `/var/lib/dbus/machine-id`
- **Raspberry Pi**: Falls back to CPU serial from `/proc/cpuinfo`
- **macOS**: Uses `system_profiler` to get Hardware UUID
- **Windows**: Uses `wmic csproduct get uuid`

### Fallback Strategy

If no hardware ID is available, the function:
1. Generates a UUID and stores it in `~/.payu-ble-id`
2. Reuses the stored UUID on subsequent calls
3. Ensures consistency across application restarts

This makes the device ID reliable across different platforms and environments.

## Advanced Examples

### Company Device Verification

```typescript
import PayuBLE from '@rwesa/payu-ble';

const companyBLE = new PayuBLE('COMPANY_DEVICE_001');

// Create a challenge that incorporates company-specific data
companyBLE.createChallenge({
  type: 'custom',
  formula: () => {
    const timestamp = Date.now();
    const deviceId = companyBLE.getDeviceId();
    return `Verify device access: ${deviceId.substring(0, 8)}-${timestamp}`;
  },
  validate: (input) => {
    // Custom verification logic for company devices
    return validateCompanyAccess(input);
  },
  ttl: 300000 // 5 minutes
});

function validateCompanyAccess(input: string): boolean {
  // Implement your company's verification logic
  return input.includes('VERIFIED');
}
```

### Gaming Use Case

```typescript
// Kids' game where solving riddles unlocks devices
const gameChallenge = createChallenge({
  type: 'custom',
  formula: () => {
    const riddles = [
      "I'm tall when I'm young, and short when I'm old. What am I?",
      "What gets wet while drying?",
      "What has one eye but can't see?"
    ];
    return riddles[Math.floor(Math.random() * riddles.length)];
  },
  validAnswers: ['candle', 'towel', 'needle'],
  caseInsensitive: true
});
```

### IoT Device with Staff Access

```typescript
// Device that only unlocks for known staff during work hours
setBLEAvailability(() => {
  const now = new Date();
  const isWorkHours = now.getHours() >= 8 && now.getHours() < 18;
  const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
  return isWorkHours && isWeekday;
});

createChallenge({
  type: 'custom',
  formula: () => "Enter your staff ID:",
  validate: (input) => {
    const validStaffIds = ['EMP001', 'EMP002', 'EMP003'];
    return validStaffIds.includes(input.toUpperCase());
  }
});
```

## API Reference

### Core Functions

#### `createChallenge(options: ChallengeOptions): Challenge`

Creates a new challenge with the specified options.

**Options:**
- `type`: `'arithmetic' | 'hash' | 'custom'`
- `difficulty?`: `1 | 2 | 3 | 4` (for arithmetic challenges)
- `formula?`: `() => string` (for custom challenges)
- `validate?`: `(input: string) => boolean` (for custom validation)
- `validAnswers?`: `string[]` (alternative to validate)
- `caseInsensitive?`: `boolean`
- `ttl?`: `number` (time-to-live in milliseconds)

#### `verifyAnswer(input: string): boolean`

Verifies if the provided answer is correct for the current challenge.

#### `setBLEAvailability(triggerFn: () => boolean): void`

Sets the availability trigger function that determines when the BLE device should be discoverable.

### Helper Functions

#### `helpers.timeBased(hours: number[]): () => boolean`

Returns a trigger function that makes the device available only during specified hours.

#### `helpers.scheduleBasedAvailability(schedule: Array<{start: string, end: string}>): () => boolean`

Returns a trigger function based on time slots (e.g., "09:00" to "17:00").

#### `helpers.alwaysAvailable(): () => boolean`

Returns a trigger function that always returns true.

### Class-based Usage

For multiple device instances:

```typescript
import PayuBLE from '@rwesa/payu-ble';

const device1 = new PayuBLE('DEVICE_001');
const device2 = new PayuBLE('DEVICE_002');

// Each device can have its own challenges and availability
device1.createChallenge({ type: 'arithmetic', difficulty: 1 });
device2.createChallenge({ type: 'hash' });
```

## Platform-Specific Implementations

The package includes both placeholder helpers and real platform-specific implementations:

### Basic Helpers (Included in main package)
- `helpers.gpioButton(pin)` - Placeholder for GPIO-based availability
- `helpers.macOnNetwork(mac)` - Placeholder for network-based detection  
- `helpers.gpsLocation(zone)` - Placeholder for location-based availability

### Real Platform Implementations
For actual hardware integration, import the platform-specific modules:

```typescript
// ES Modules
import { gpioButton, macOnNetwork, gpsLocationTrigger } from '@rwesa/payu-ble/platform';

// CommonJS
const { gpioButton, macOnNetwork, gpsLocationTrigger } = require('@rwesa/payu-ble/platform');

// Set up GPIO button availability (Raspberry Pi, etc.)
setBLEAvailability(gpioButton(18, { activeLow: true }));

// Set up network MAC detection
setBLEAvailability(macOnNetwork('aa:bb:cc:dd:ee:ff'));

// Set up GPS geofencing
setBLEAvailability(gpsLocationTrigger({
  latitude: 40.7128,
  longitude: -74.0060,
  radius: 100 // meters
}));
```

**Platform Requirements:**
- **GPIO**: Requires `onoff` package (Linux/Raspberry Pi)
- **Network**: Uses ARP table scanning (Windows/Mac/Linux)
- **GPS**: Requires GPS hardware/service integration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

Copyright (c) 2025 payu-ble contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.