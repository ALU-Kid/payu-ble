# PayuBLE Browser Demo

This demo shows how to integrate PayuBLE with Web Bluetooth API in a browser environment.

## Features

- 🔍 **Device Discovery**: Scan for PayuBLE-enabled devices
- 🔗 **Connection Management**: Connect and disconnect from devices
- 🧩 **Challenge Handling**: Receive and respond to device challenges
- 📱 **Mobile Friendly**: Responsive design for mobile browsers
- 🎮 **Demo Mode**: Simulated device for testing without hardware

## Requirements

- **Browser**: Chrome 56+, Edge 79+, or Opera 43+ (Web Bluetooth support required)
- **Protocol**: HTTPS or localhost (Web Bluetooth security requirement)
- **Device**: PayuBLE-enabled BLE device advertising the correct service UUID

## Running the Demo

### Option 1: Local Development
```bash
# Serve the demo locally (required for Web Bluetooth)
cd demo/browser
python -m http.server 8000
# or
npx serve .
```

Then open: `http://localhost:8000`

### Option 2: HTTPS Deployment
Deploy to any HTTPS-enabled web server (GitHub Pages, Netlify, etc.)

## How to Use

1. **Open the demo** in a supported browser over HTTPS
2. **Click "Scan for PayuBLE Devices"** to discover nearby devices
3. **Select a device** from the discovered list
4. **Click "Connect to Device"** to establish connection
5. **Solve the challenge** presented by the device
6. **Submit your answer** to complete authentication

## Service UUIDs

The demo expects PayuBLE devices to advertise with these UUIDs:

```javascript
const PAYU_BLE_SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
const CHALLENGE_CHARACTERISTIC_UUID = '87654321-4321-4321-4321-cba987654321';
const ANSWER_CHARACTERISTIC_UUID = '11111111-2222-3333-4444-555555555555';
```

## Demo Mode

If no real PayuBLE devices are available, the demo includes a simulated device for testing:

- Provides sample challenges (math problems and riddles)
- Accepts common answers for demonstration
- Shows the complete flow without real hardware

## Integration Guide

To integrate PayuBLE Web Bluetooth support into your own application:

### 1. Device Discovery
```javascript
const device = await navigator.bluetooth.requestDevice({
    filters: [
        { namePrefix: 'PayuBLE' },
        { services: [PAYU_BLE_SERVICE_UUID] }
    ],
    optionalServices: [PAYU_BLE_SERVICE_UUID]
});
```

### 2. Connect and Get Service
```javascript
const server = await device.gatt.connect();
const service = await server.getPrimaryService(PAYU_BLE_SERVICE_UUID);
const challengeChar = await service.getCharacteristic(CHALLENGE_CHARACTERISTIC_UUID);
```

### 3. Read Challenge
```javascript
const value = await challengeChar.readValue();
const challengeText = new TextDecoder().decode(value);
```

### 4. Submit Answer
```javascript
const answerChar = await service.getCharacteristic(ANSWER_CHARACTERISTIC_UUID);
const encoder = new TextEncoder();
await answerChar.writeValue(encoder.encode(userAnswer));

// Read result
const resultValue = await answerChar.readValue();
const result = new TextDecoder().decode(resultValue);
```

## Troubleshooting

### "Web Bluetooth not supported"
- Use Chrome, Edge, or Opera browser
- Ensure you're on HTTPS or localhost
- Update browser to latest version

### "No devices found"
- Ensure PayuBLE device is advertising
- Check that device is in range
- Verify service UUIDs match

### "Connection failed"
- Device may be connected to another client
- Try restarting the device
- Check device permissions in browser settings

### "Challenge not received"
- Verify characteristic UUIDs
- Check device implementation
- Try disconnecting and reconnecting

## Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 56+ | ✅ Full |
| Edge | 79+ | ✅ Full |
| Opera | 43+ | ✅ Full |
| Firefox | - | ❌ No Web Bluetooth |
| Safari | - | ❌ No Web Bluetooth |

## Security Considerations

- Web Bluetooth requires user gesture for device pairing
- HTTPS is mandatory for security
- Devices can only be accessed by the origin that paired them
- Consider implementing additional authentication layers for sensitive applications

## Next Steps

- Implement your own PayuBLE BLE peripheral
- Customize the challenge types and validation
- Add error handling and retry logic
- Integrate with your application's authentication system