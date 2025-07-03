# PayuBLE Protocol Documentation

## Overview

The PayuBLE protocol provides a sophisticated challenge-response system for securing Bluetooth Low Energy (BLE) connections. Instead of relying on traditional static pairing methods, PayuBLE introduces dynamic challenges that must be solved before connection or access is granted.

## Why PayuBLE?

### Traditional BLE Security Limitations

Traditional BLE security mechanisms have several limitations:

1. **Static Pairing**: Once paired, devices typically remain connected without ongoing authentication
2. **PIN/Passkey Vulnerabilities**: Static PINs can be intercepted or brute-forced
3. **Limited Context Awareness**: Traditional pairing doesn't consider time, location, or other contextual factors
4. **Poor User Experience**: Complex pairing procedures often lead to poor security practices

### PayuBLE Advantages

PayuBLE addresses these limitations by providing:

1. **Dynamic Authentication**: Challenges change with each connection attempt
2. **Contextual Security**: Availability can be tied to time, location, or environmental factors
3. **Flexible Challenge Types**: From simple math to complex cryptographic puzzles
4. **User-Friendly**: Intuitive challenge-response interface
5. **Scalable Security**: Difficulty can be adjusted based on security requirements

## Protocol Architecture

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   BLE Device    │    │  PayuBLE Core   │    │  Client App     │
│  (Host/Server)  │◄──►│   (Protocol)    │◄──►│ (Mobile/Web)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

1. **BLE Device (Host)**: The device advertising the BLE service and generating challenges
2. **PayuBLE Core**: The protocol implementation handling challenge creation and verification
3. **Client Application**: The connecting device that receives and solves challenges

### Challenge Flow

```
1. Client discovers BLE device
2. Device checks availability conditions
3. If available, device generates challenge
4. Challenge is transmitted to client
5. Client presents challenge to user
6. User provides answer
7. Client submits answer to device
8. Device verifies answer
9. Connection granted/denied based on result
```

## Challenge Types

### 1. Arithmetic Challenges

Mathematical problems with varying difficulty levels.

**Use Cases:**
- Educational devices for children
- Simple authentication for low-security applications
- Quick verification for trusted environments

**Security Level:** Low to Medium

**Example Implementation:**
```typescript
const challenge = createChallenge({
  type: 'arithmetic',
  difficulty: 3  // Creates: "Solve: 25 + 6 × 8"
});
```

**Difficulty Levels:**
- **Level 1**: Simple addition/subtraction (5 + 3)
- **Level 2**: Basic multiplication (12 × 4)
- **Level 3**: Order of operations (25 + 6 × 8)
- **Level 4**: Complex expressions ((75 + 15) × 12 - 8)

### 2. Hash-Based Challenges

Cryptographic puzzles based on device identifiers and timestamps.

**Use Cases:**
- High-security environments
- Enterprise device authentication
- Time-sensitive access control

**Security Level:** High

**Example Implementation:**
```typescript
const challenge = createChallenge({
  type: 'hash'
});
// Generates: "What is (SHA256("DEVICE123456781640995200")) % 100?"
```

**Security Features:**
- Device ID incorporation prevents replay attacks
- Timestamp inclusion ensures temporal uniqueness
- Modular arithmetic simplifies answer calculation
- SHA256 provides cryptographic strength

### 3. Custom Challenges

User-defined challenges with flexible validation rules.

**Use Cases:**
- Brand-specific authentication
- Context-aware security
- Educational applications
- Gaming scenarios

**Security Level:** Variable (depends on implementation)

**Example Implementations:**

**Riddle-Based:**
```typescript
const challenge = createChallenge({
  type: 'custom',
  formula: () => "What has keys but can't open locks?",
  validAnswers: ['piano', 'keyboard'],
  caseInsensitive: true
});
```

**Password Validation:**
```typescript
const challenge = createChallenge({
  type: 'custom',
  formula: () => 'Enter company access code:',
  validate: (input) => validateCompanyCode(input)
});
```

**Time-Sensitive:**
```typescript
const challenge = createChallenge({
  type: 'custom',
  formula: () => `Code: ${generateTimeCode()}`,
  validate: (input) => input === getCurrentTimeCode(),
  ttl: 60000  // 1 minute expiration
});
```

## Availability Control

### Purpose

Availability control determines when a BLE device advertises itself and accepts connections. This adds an additional layer of security by making devices discoverable only under specific conditions.

### Built-in Availability Triggers

#### Time-Based Availability
```typescript
setBLEAvailability(helpers.timeBased([9, 10, 11, 14, 15, 16]));