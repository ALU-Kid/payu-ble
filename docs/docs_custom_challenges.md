# Custom Challenges Guide

PayuBLE's custom challenge system allows you to create sophisticated authentication mechanisms tailored to your specific use case. This guide covers advanced patterns, best practices, and real-world examples.

## Table of Contents

- [Basic Custom Challenges](#basic-custom-challenges)
- [Advanced Validation Patterns](#advanced-validation-patterns)
- [Time-Sensitive Challenges](#time-sensitive-challenges)
- [Context-Aware Challenges](#context-aware-challenges)
- [Security Considerations](#security-considerations)
- [Performance Optimization](#performance-optimization)
- [Real-World Examples](#real-world-examples)

## Basic Custom Challenges

### Simple Q&A Challenge

```typescript
const challenge = createChallenge({
  type: 'custom',
  formula: () => 'What is the company motto?',
  validAnswers: ['Innovation First', 'Quality Matters'],
  caseInsensitive: true
});
```

### Dynamic Content Challenge

```typescript
const challenge = createChallenge({
  type: 'custom',
  formula: () => {
    const topics = ['security', 'innovation', 'teamwork'];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    return `What is our ${topic} policy number?`;
  },
  validate: (input) => {
    // Look up policy number based on the question asked
    return validatePolicyNumber(input);
  }
});
```

## Advanced Validation Patterns

### Multi-Step Validation

```typescript
const challenge = createChallenge({
  type: 'custom',
  formula: () => 'Enter your employee ID and department (format: ID-DEPT)',
  validate: (input) => {
    const parts = input.split('-');
    if (parts.length !== 2) return false;
    
    const [id, dept] = parts;
    return validateEmployeeID(id) && validateDepartment(dept);
  }
});

function validateEmployeeID(id: string): boolean {
  return /^EMP\d{4}$/.test(id);
}

function validateDepartment(dept: string): boolean {
  const validDepts = ['ENG', 'HR', 'SALES', 'MARKETING'];
  return validDepts.includes(dept.toUpperCase());
}
```

### Pattern-Based Validation

```typescript
const challenge = createChallenge({
  type: 'custom',
  formula: () => 'Create a strong password (8+ chars, 1 number, 1 uppercase, 1 special)',
  validate: (input) => {
    if (input.length < 8) return false;
    if (!/[A-Z]/.test(input)) return false;
    if (!/[0-9]/.test(input)) return false;
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(input)) return false;
    return true;
  }
});
```

### Mathematical Validation

```typescript
const challenge = createChallenge({
  type: 'custom',
  formula: () => {
    const a = Math.floor(Math.random() * 100) + 1;
    const b = Math.floor(Math.random() * 100) + 1;
    // Store values for validation (in production, use better state management)
    (challenge as any)._values = { a, b };
    return `If you invest $${a} at ${b}% annual interest, what is the value after 2 years? (round to nearest dollar)`;
  },
  validate: (input) => {
    const { a, b } = (challenge as any)._values;
    const expected = Math.round(a * Math.pow(1 + b/100, 2));
    const userAnswer = parseInt(input.replace(/[$,]/g, ''));
    return Math.abs(userAnswer - expected) <= 1; // Allow $1 rounding difference
  }
});
```

## Time-Sensitive Challenges

### Time-Based Codes

```typescript
function createTimeBasedChallenge(windowMinutes: number = 5) {
  return createChallenge({
    type: 'custom',
    formula: () => {
      const now = Date.now();
      const window = Math.floor(now / (windowMinutes * 60 * 1000));
      const code = (window % 1000).toString().padStart(3, '0');
      return `Enter the current time code (changes every ${windowMinutes} minutes): ${code}`;
    },
    validate: (input) => {
      const now = Date.now();
      const window = Math.floor(now / (windowMinutes * 60 * 1000));
      const expectedCode = (window % 1000).toString().padStart(3, '0');
      return input.trim() === expectedCode;
    },
    ttl: windowMinutes * 60 * 1000 // Expire with the time window
  });
}
```

### Countdown Challenges

```typescript
function createCountdownChallenge(seconds: number) {
  const startTime = Date.now();
  
  return createChallenge({
    type: 'custom',
    formula: () => `Quick! Enter 'URGENT' within ${seconds} seconds!`,
    validate: (input) => {
      const elapsed = Date.now() - startTime;
      return input.toUpperCase() === 'URGENT' && elapsed <= seconds * 1000;
    },
    ttl: seconds * 1000
  });
}
```

## Context-Aware Challenges

### Location-Based Challenges

```typescript
function createLocationChallenge(expectedLocation: string) {
  return createChallenge({
    type: 'custom',
    formula: () => 'What building are you currently in?',
    validate: async (input) => {
      // In a real implementation, you might:
      // 1. Get user's GPS coordinates
      // 2. Reverse geocode to building name
      // 3. Compare with expected location
      const currentLocation = await getCurrentLocation();
      return input.toLowerCase().includes(expectedLocation.toLowerCase());
    }
  });
}
```

### Device-Specific Challenges

```typescript
function createDeviceChallenge(deviceInfo: any) {
  return createChallenge({
    type: 'custom',
    formula: () => 'What is the serial number of this device?',
    validate: (input) => {
      return input.toUpperCase() === deviceInfo.serialNumber.toUpperCase();
    }
  });
}
```

### Network-Based Challenges

```typescript
function createNetworkChallenge() {
  return createChallenge({
    type: 'custom',
    formula: () => 'What is the name of the WiFi network you are connected to?',
    validate: async (input) => {
      const currentNetwork = await getCurrentWiFiNetwork();
      return input.toLowerCase() === currentNetwork.toLowerCase();
    }
  });
}
```

## Security Considerations

### Rate Limiting

```typescript
class RateLimitedChallenge {
  private attempts: Map<string, number> = new Map();
  private lockouts: Map<string, number> = new Map();
  
  createChallenge(clientId: string, maxAttempts: number = 3) {
    // Check if client is locked out
    const lockoutTime = this.lockouts.get(clientId);
    if (lockoutTime && Date.now() < lockoutTime) {
      throw new Error('Too many failed attempts. Try again later.');
    }
    
    return createChallenge({
      type: 'custom',
      formula: () => 'Enter the access code:',
      validate: (input) => {
        const attempts = this.attempts.get(clientId) || 0;
        
        if (attempts >= maxAttempts) {
          this.lockouts.set(clientId, Date.now() + 15 * 60 * 1000); // 15 min lockout
          throw new Error('Maximum attempts exceeded.');
        }
        
        const isValid = this.validateAccessCode(input);
        
        if (!isValid) {
          this.attempts.set(clientId, attempts + 1);
        } else {
          this.attempts.delete(clientId);
        }
        
        return isValid;
      }
    });
  }
  
  private validateAccessCode(input: string): boolean {
    // Implement your access code validation
    return input === 'SECRET123';
  }
}
```

### Input Sanitization

```typescript
function createSafeChallenge() {
  return createChallenge({
    type: 'custom',
    formula: () => 'Enter your username:',
    validate: (input) => {
      // Sanitize input
      const sanitized = input
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, '') // Only allow alphanumeric, underscore, hyphen
        .toLowerCase();
      
      if (sanitized.length < 3 || sanitized.length > 20) {
        return false;
      }
      
      return validateUsername(sanitized);
    }
  });
}
```

## Performance Optimization

### Cached Validation

```typescript
class CachedValidationChallenge {
  private cache: Map<string, boolean> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  
  createChallenge() {
    return createChallenge({
      type: 'custom',
      formula: () => 'Enter your access token:',
      validate: (input) => {
        const cacheKey = `token_${input}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached !== undefined) {
          return cached;
        }
        
        const isValid = this.expensiveTokenValidation(input);
        
        // Cache result
        this.cache.set(cacheKey, isValid);
        setTimeout(() => {
          this.cache.delete(cacheKey);
        }, this.cacheExpiry);
        
        return isValid;
      }
    });
  }
  
  private expensiveTokenValidation(token: string): boolean {
    // Simulate expensive operation (database lookup, API call, etc.)
    return token.length === 32 && /^[a-f0-9]+$/.test(token);
  }
}
```

### Async Validation with Timeout

```typescript
function createAsyncChallenge() {
  return createChallenge({
    type: 'custom',
    formula: () => 'Enter your verification code:',
    validate: (input) => {
      return new Promise((resolve) => {
        // Set timeout for async operation
        const timeout = setTimeout(() => {
          resolve(false);
        }, 5000); // 5 second timeout
        
        // Perform async validation
        validateCodeWithAPI(input)
          .then((result) => {
            clearTimeout(timeout);
            resolve(result);
          })
          .catch(() => {
            clearTimeout(timeout);
            resolve(false);
          });
      });
    }
  });
}
```

## Real-World Examples

### Corporate Badge Access

```typescript
function createBadgeAccessChallenge(facility: string) {
  return createChallenge({
    type: 'custom',
    formula: () => `Access to ${facility} requires badge verification. Enter your badge number:`,
    validate: async (input) => {
      const badgeNumber = input.trim().toUpperCase();
      
      // Validate format
      if (!/^[A-Z]{2}\d{6}$/.test(badgeNumber)) {
        return false;
      }
      
      // Check database
      const employee = await lookupEmployee(badgeNumber);
      if (!employee) return false;
      
      // Check access permissions
      const hasAccess = await checkFacilityAccess(employee.id, facility);
      
      // Log access attempt
      await logAccessAttempt(employee.id, facility, hasAccess);
      
      return hasAccess;
    },
    ttl: 30000 // 30 second timeout
  });
}
```

### Medical Device Authentication

```typescript
function createMedicalDeviceChallenge(patientId: string) {
  return createChallenge({
    type: 'custom',
    formula: () => 'Enter the patient ID and your medical license number (format: PATIENT-LICENSE):',
    validate: async (input) => {
      const parts = input.split('-');
      if (parts.length !== 2) return false;
      
      const [inputPatientId, licenseNumber] = parts;
      
      // Verify patient ID matches
      if (inputPatientId !== patientId) return false;
      
      // Verify medical license
      const license = await verifyMedicalLicense(licenseNumber);
      if (!license || !license.isActive) return false;
      
      // Check if doctor has access to this patient
      const hasPatientAccess = await checkPatientAccess(license.doctorId, patientId);
      
      // Audit log
      await auditLog({
        action: 'DEVICE_ACCESS_ATTEMPT',
        doctorId: license.doctorId,
        patientId,
        success: hasPatientAccess,
        timestamp: new Date()
      });
      
      return hasPatientAccess;
    }
  });
}
```

### IoT Device Commissioning

```typescript
function createCommissioningChallenge(deviceModel: string) {
  return createChallenge({
    type: 'custom',
    formula: () => {
      const pin = Math.floor(Math.random() * 900000) + 100000; // 6-digit PIN
      // In real implementation, display this PIN on device screen/LED
      displayPinOnDevice(pin);
      return 'Enter the 6-digit PIN shown on the device display:';
    },
    validate: (input) => {
      const enteredPin = parseInt(input.trim());
      const expectedPin = getCurrentDevicePin();
      
      if (enteredPin === expectedPin) {
        // Mark device as commissioned
        markDeviceCommissioned(deviceModel);
        return true;
      }
      
      return false;
    },
    ttl: 300000 // 5 minutes to enter PIN
  });
}
```

## Best Practices

1. **Keep prompts clear and specific**
2. **Validate input format before business logic**
3. **Implement proper error handling**
4. **Use appropriate TTL values**
5. **Log security events**
6. **Consider rate limiting for sensitive operations**
7. **Sanitize all user inputs**
8. **Use HTTPS for any network operations**
9. **Implement proper session management**
10. **Test edge cases thoroughly**

## Testing Custom Challenges

```typescript
describe('Custom Challenge Tests', () => {
  it('should validate employee badge format', () => {
    const challenge = createBadgeAccessChallenge('Building A');
    
    // Valid format
    expect(challenge.validate('AB123456')).resolves.toBeTruthy();
    
    // Invalid formats
    expect(challenge.validate('123456')).resolves.toBeFalsy();
    expect(challenge.validate('ABCD1234')).resolves.toBeFalsy();