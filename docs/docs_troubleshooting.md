# PayuBLE Troubleshooting Guide

This guide helps you diagnose and resolve common issues when working with PayuBLE.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Challenge Creation Problems](#challenge-creation-problems)
- [Verification Failures](#verification-failures)
- [Platform Integration Issues](#platform-integration-issues)
- [Browser Demo Problems](#browser-demo-problems)
- [Performance Issues](#performance-issues)
- [Common Error Messages](#common-error-messages)
- [Debugging Tips](#debugging-tips)

## Installation Issues

### NPM Installation Failures

**Problem**: `npm install payu-ble` fails with permission errors
```bash
Error: EACCES: permission denied, mkdir '/usr/local/lib/node_modules/payu-ble'
```

**Solutions**:
```bash
# Option 1: Use npm with --user flag
npm install --user payu-ble

# Option 2: Configure npm to use different directory
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH

# Option 3: Use yarn instead
yarn add payu-ble
```

**Problem**: Native module compilation fails
```bash
Error: Failed to compile native modules
```

**Solutions**:
```bash
# Linux/macOS: Install build tools
sudo apt-get install build-essential python3-dev  # Ubuntu/Debian
# or
xcode-select --install  # macOS

# Windows: Install Visual Studio Build Tools
npm install --global windows-build-tools
```

### TypeScript Configuration Issues

**Problem**: TypeScript compilation errors
```typescript
error TS2307: Cannot find module 'payu-ble' or its corresponding type declarations
```

**Solutions**:
```bash
# Ensure TypeScript is installed
npm install -g typescript

# Check tsconfig.json includes correct module resolution
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}

# Force reinstall with types
npm uninstall payu-ble
npm install payu-ble --save
```

## Challenge Creation Problems

### Invalid Challenge Configuration

**Problem**: Custom challenges throw configuration errors
```typescript
Error: Custom challenge requires either validate function or validAnswers array
```

**Solution**:
```typescript
// ❌ Incorrect - missing validation
createChallenge({
  type: 'custom',
  formula: () => 'What is your name?'
  // Missing validate or validAnswers
});

// ✅ Correct - with validAnswers
createChallenge({
  type: 'custom',
  formula: () => 'What is your name?',
  validAnswers: ['Alice', 'Bob']
});

// ✅ Correct - with validate function
createChallenge({
  type: 'custom',
  formula: () => 'What is your name?',
  validate: (input) => input.length > 0
});
```

### Arithmetic Challenge Issues

**Problem**: Arithmetic challenges produce invalid expressions
```typescript
// Challenge shows: "Solve: NaN + undefined"
```

**Solution**:
```typescript
// Check difficulty level is valid
const validDifficulties = [1, 2, 3, 4];
const difficulty = Math.min(Math.max(userDifficulty, 1), 4);

createChallenge({
  type: 'arithmetic',
  difficulty: difficulty
});
```

### Hash Challenge Problems

**Problem**: Hash challenges fail with crypto errors
```typescript
Error: Cannot find module 'crypto'
```

**Solution**:
```typescript
// Ensure crypto is properly imported
const crypto = require('crypto');

// For browser environments, use a crypto polyfill
npm install crypto-browserify

// In webpack config:
module.exports = {
  resolve: {
    fallback: {
      "crypto": require.resolve("crypto-browserify")
    }
  }
};
```

## Verification Failures

### Case Sensitivity Issues

**Problem**: Correct answers are rejected due to case differences
```typescript
// User enters "BLUE" but answer is "blue"
```

**Solution**:
```typescript
// Enable case-insensitive matching
createChallenge({
  type: 'custom',
  formula: () => 'What color is the sky?',
  validAnswers: ['blue'],
  caseInsensitive: true  // Add this flag
});
```

### Whitespace Handling

**Problem**: Answers with extra spaces are rejected
```typescript
// User enters " 42 " but validation expects "42"
```

**Solution**:
```typescript
// Trim whitespace in validation
createChallenge({
  type: 'custom',
  formula: () => 'What is 6 × 7?',
  validate: (input) => {
    const trimmed = input.trim();
    return parseInt(trimmed) === 42;
  }
});
```

### Expired Challenge Verification

**Problem**: Getting "Challenge has expired" errors
```typescript
Error: Challenge has expired
```

**Solutions**:
```typescript
// 1. Increase TTL for slower users
createChallenge({
  type: 'custom',
  formula: () => 'Enter password:',
  validAnswers: ['secret'],
  ttl: 300000  // 5 minutes instead of default
});

// 2. Check system time synchronization
console.log('Current time:', new Date());
console.log('Challenge expires:', new Date(challenge.expiresAt));

// 3. Handle expiration gracefully
try {
  const result = verifyAnswer(userInput);
} catch (error) {
  if (error.message.includes('expired')) {
    // Generate new challenge
    const newChallenge = createChallenge(options);
  }
}
```

## Platform Integration Issues

### GPIO Problems (Raspberry Pi)

**Problem**: GPIO access denied
```bash
Error: EACCES: permission denied, open '/sys/class/gpio/export'
```

**Solutions**:
```bash
# Add user to gpio group
sudo usermod -a -G gpio $USER

# Enable GPIO interface
sudo raspi-config
# Interface Options > GPIO > Enable

# Check GPIO permissions
ls -la /sys/class/gpio/

# Alternative: Run with sudo (not recommended for production)
sudo node your-app.js
```

**Problem**: GPIO pins already in use
```typescript
Error: EBUSY: resource busy or locked
```

**Solutions**:
```typescript
// Properly cleanup GPIO on exit
const gpio = new GPIOButtonHelper({ pin: 18 });

process.on('SIGINT', () => {
  gpio.cleanup();
  process.exit();
});

process.on('SIGTERM', () => {
  gpio.cleanup();
  process.exit();
});

// Check if pin is already exported
const fs = require('fs');
if (fs.existsSync('/sys/class/gpio/gpio18')) {
  // Pin is already exported, unexport first
  fs.writeFileSync('/sys/class/gpio/unexport', '18');
}
```

### Network Detection Issues

**Problem**: No devices found in network scan
```typescript
// Empty array returned from discoverLocalDevices()
```

**Solutions**:
```bash
# 1. Populate ARP table first
ping -c 1 192.168.1.1
nmap -sn 192.168.1.0/24

# 2. Check network interface
ip addr show
ifconfig  # on older systems

# 3. Verify subnet configuration
```

```typescript
// Use correct subnet for your network
const networkHelper = new NetworkMACHelper({
  scanSubnet: true,
  subnet: '192.168.1.0/24'  // Adjust to your network
});
```

**Problem**: ARP command not found
```bash
Error: Command not found: arp
```

**Solutions**:
```bash
# Install network tools
sudo apt-get install net-tools      # Ubuntu/Debian
sudo yum install net-tools          # CentOS/RHEL
brew install arp-scan               # macOS
```

### GPS/Location Issues

**Problem**: IP geolocation fails
```typescript
Error: Fetch failed
```

**Solutions**:
```typescript
// Use alternative geolocation services
const services = [
  'http://ip-api.com/json',
  'https://ipapi.co/json',
  'https://api.ipify.org?format=json'
];

for (const service of services) {
  try {
    const response = await fetch(service);
    if (response.ok) {
      // Use this service
      break;
    }
  } catch (error) {
    console.warn(`Service ${service} failed:`, error);
  }
}
```

**Problem**: Location accuracy too low
```typescript
// IP location shows city instead of building
```

**Solutions**:
```typescript
// Increase radius for IP-based location
const zone = {
  lat: 40.7128,
  lng: -74.0060,
  radius: 5000  // 5km radius for city-level accuracy
};

// Or implement hardware GPS for precise location
const gpsHelper = new GPSLocationHelper({
  useIPLocation: false,  // Use hardware GPS
  accuracyThreshold: 10  // 10 meter accuracy
});
```

## Browser Demo Problems

### Web Bluetooth Not Supported

**Problem**: "Web Bluetooth not supported" message
```javascript
Error: navigator.bluetooth is undefined
```

**Solutions**:
1. **Use supported browser**: Chrome 56+, Edge 79+, Opera 43+
2. **Enable HTTPS**: Web Bluetooth requires secure context
3. **Check flags**: For experimental features, enable `chrome://flags/#enable-experimental-web-platform-features`

```javascript
// Feature detection
if (!navigator.bluetooth) {
  console.error('Web Bluetooth not supported');
  // Show alternative connection method
}
```

### Device Discovery Issues

**Problem**: No PayuBLE devices found
```javascript
Error: No devices found matching filters
```

**Solutions**:
```javascript
// 1. Verify device is advertising
// Check device implementation advertises correct service UUID

// 2. Expand search filters
const device = await navigator.bluetooth.requestDevice({
  acceptAllDevices: true,  // For testing
  optionalServices: [PAYU_BLE_SERVICE_UUID]
});

// 3. Check service UUID matches
const PAYU_BLE_SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
// Ensure device uses same UUID
```

### Connection Failures

**Problem**: GATT connection fails
```javascript
Error: GATT Server is disconnected
```

**Solutions**:
```javascript
// 1. Implement connection retry
async function connectWithRetry(device, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await device.gatt.connect();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// 2. Handle disconnect events
device.addEventListener('gattserverdisconnected', () => {
  console.log('Device disconnected, attempting reconnect...');
  // Implement reconnection logic
});

// 3. Check device power management
// Some devices enter sleep mode, may need wake signal
```

## Performance Issues

### Slow Challenge Generation

**Problem**: Creating challenges takes too long
```typescript
// Hash challenges taking several seconds
```

**Solutions**:
```typescript
// 1. Pre-generate challenges
const challengeCache = [];
for (let i = 0; i < 10; i++) {
  challengeCache.push(createChallenge({ type: 'arithmetic', difficulty: 2 }));
}

// 2. Use worker threads for complex calculations
const { Worker, isMainThread, parentPort } = require('worker_threads');

if (isMainThread) {
  const worker = new Worker(__filename);
  worker.postMessage({ type: 'generateChallenge' });
  worker.on('message', (challenge) => {
    // Use generated challenge
  });
} else {
  parentPort.on('message', (data) => {
    if (data.type === 'generateChallenge') {
      const challenge = createChallenge({ type: 'hash' });
      parentPort.postMessage(challenge);
    }
  });
}
```

### Memory Leaks

**Problem**: Memory usage increases over time
```bash
# Process memory keeps growing
```

**Solutions**:
```typescript
// 1. Clear expired challenges
setInterval(() => {
  if (getCurrentChallenge()?.expiresAt && Date.now() > getCurrentChallenge().expiresAt) {
    clearChallenge();
  }
}, 60000);

// 2. Cleanup GPIO resources
process.on('exit', () => {
  gpioHelper.cleanup();
});

// 3. Limit cache sizes
class LimitedCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}
```

## Common Error Messages

### "No active challenge"

**Cause**: Trying to verify answer without creating challenge first
**Solution**:
```typescript
// Always create challenge before verification
const challenge = createChallenge({
  type: 'arithmetic',
  difficulty: 1
});

// Then verify
const result = verifyAnswer('42');
```

### "Unsupported challenge type"

**Cause**: Invalid challenge type passed to createChallenge
**Solution