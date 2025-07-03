import PayuBLE, { createChallenge, verifyAnswer, helpers } from '../src/index';

describe('PayuBLE Advanced Test Suite', () => {
  let payuBLE: PayuBLE;

  beforeEach(() => {
    payuBLE = new PayuBLE('TEST_DEVICE_ADVANCED');
  });

  afterEach(() => {
    payuBLE.clearChallenge();
  });

  describe('TTL Expiration Logic', () => {
    it('should handle TTL expiration correctly', async () => {
      const challenge = payuBLE.createChallenge({
        type: 'custom',
        formula: () => 'Quick question',
        validAnswers: ['quick'],
        ttl: 100 // 100ms
      });

      expect(challenge.expiresAt).toBeDefined();
      expect(challenge.expiresAt).toBeGreaterThan(Date.now());
      expect(challenge.expiresAt).toBeLessThanOrEqual(Date.now() + 100);

      // Should work immediately
      expect(payuBLE.verifyAnswer('quick')).toBe(true);

      // Reset challenge for next test
      payuBLE.createChallenge({
        type: 'custom',
        formula: () => 'Quick question',
        validAnswers: ['quick'],
        ttl: 50
      });

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 75));

      // Should fail after expiration
      expect(() => payuBLE.verifyAnswer('quick')).toThrow('Challenge has expired');
      expect(payuBLE.getCurrentChallenge()).toBeNull();
    });

    it('should handle edge case around expiration time', async () => {
      const shortTTL = 25; // Very short TTL
      const challenge = payuBLE.createChallenge({
        type: 'custom',
        formula: () => 'Edge case test',
        validAnswers: ['edge'],
        ttl: shortTTL
      });

      // Verify just before expiration
      await new Promise(resolve => setTimeout(resolve, shortTTL - 5));
      expect(payuBLE.verifyAnswer('edge')).toBe(true);

      // Create new challenge for expiration test
      payuBLE.createChallenge({
        type: 'custom',
        formula: () => 'Edge case test',
        validAnswers: ['edge'],
        ttl: 10
      });

      // Verify just after expiration
      await new Promise(resolve => setTimeout(resolve, 15));
      expect(() => payuBLE.verifyAnswer('edge')).toThrow('Challenge has expired');
    });

    it('should not expire challenges without TTL', async () => {
      const challenge = payuBLE.createChallenge({
        type: 'custom',
        formula: () => 'Persistent challenge',
        validAnswers: ['persistent']
        // No TTL specified
      });

      expect(challenge.expiresAt).toBeUndefined();

      // Wait longer than any reasonable TTL
      await new Promise(resolve => setTimeout(resolve, 200));

      // Should still be valid
      expect(payuBLE.verifyAnswer('persistent')).toBe(true);
    });

    it('should handle multiple rapid TTL expirations', async () => {
      for (let i = 0; i < 5; i++) {
        payuBLE.createChallenge({
          type: 'custom',
          formula: () => `Challenge ${i}`,
          validAnswers: [`answer${i}`],
          ttl: 20
        });

        await new Promise(resolve => setTimeout(resolve, 25));

        expect(() => payuBLE.verifyAnswer(`answer${i}`)).toThrow('Challenge has expired');
      }
    });
  });

  describe('Custom Challenge Validate Function', () => {
    it('should execute validate function correctly', () => {
      let validationCallCount = 0;
      
      const challenge = payuBLE.createChallenge({
        type: 'custom',
        formula: () => 'Enter a number greater than 10',
        validate: (input) => {
          validationCallCount++;
          const num = parseInt(input);
          return !isNaN(num) && num > 10;
        }
      });

      expect(challenge.validate).toBeDefined();

      // Test valid inputs
      expect(payuBLE.verifyAnswer('15')).toBe(true);
      expect(payuBLE.verifyAnswer('100')).toBe(true);

      // Test invalid inputs
      expect(payuBLE.verifyAnswer('5')).toBe(false);
      expect(payuBLE.verifyAnswer('10')).toBe(false);
      expect(payuBLE.verifyAnswer('abc')).toBe(false);

      expect(validationCallCount).toBe(5);
    });

    it('should handle validate function with complex logic', () => {
      const challenge = payuBLE.createChallenge({
        type: 'custom',
        formula: () => 'Enter email and age separated by comma (email,age)',
        validate: (input) => {
          const parts = input.split(',');
          if (parts.length !== 2) return false;
          
          const [email, ageStr] = parts.map(p => p.trim());
          
          // Simple email validation
          const emailValid = email.includes('@') && email.includes('.');
          
          // Age validation
          const age = parseInt(ageStr);
          const ageValid = !isNaN(age) && age >= 18 && age <= 120;
          
          return emailValid && ageValid;
        }
      });

      // Valid inputs
      expect(payuBLE.verifyAnswer('test@example.com, 25')).toBe(true);
      expect(payuBLE.verifyAnswer('user@domain.org,30')).toBe(true);

      // Invalid inputs
      expect(payuBLE.verifyAnswer('notanemail, 25')).toBe(false);
      expect(payuBLE.verifyAnswer('test@example.com, 15')).toBe(false);
      expect(payuBLE.verifyAnswer('test@example.com')).toBe(false);
      expect(payuBLE.verifyAnswer('test@example.com, abc')).toBe(false);
    });

    it('should handle validate function errors gracefully', () => {
      const challenge = payuBLE.createChallenge({
        type: 'custom',
        formula: () => 'This validator will throw an error',
        validate: (input) => {
          if (input === 'throw') {
            throw new Error('Validation error');
          }
          return input === 'valid';
        }
      });

      // Normal operation
      expect(payuBLE.verifyAnswer('valid')).toBe(true);
      expect(payuBLE.verifyAnswer('invalid')).toBe(false);

      // Should handle thrown errors gracefully
      expect(payuBLE.verifyAnswer('throw')).toBe(false);
    });

    it('should handle async-like validate functions', () => {
      const challenge = payuBLE.createChallenge({
        type: 'custom',
        formula: () => 'Enter a valid username',
        validate: (input) => {
          // Simulate some complex validation logic
          const isValidLength = input.length >= 3 && input.length <= 20;
          const hasValidChars = /^[a-zA-Z0-9_]+$/.test(input);
          const isNotReserved = !['admin', 'root', 'test'].includes(input.toLowerCase());
          
          return isValidLength && hasValidChars && isNotReserved;
        }
      });

      expect(payuBLE.verifyAnswer('validuser')).toBe(true);
      expect(payuBLE.verifyAnswer('user_123')).toBe(true);
      
      expect(payuBLE.verifyAnswer('ab')).toBe(false); // Too short
      expect(payuBLE.verifyAnswer('admin')).toBe(false); // Reserved
      expect(payuBLE.verifyAnswer('user-name')).toBe(false); // Invalid chars
    });
  });

  describe('ValidAnswers Logic for Riddles', () => {
    it('should match any valid answer from array', () => {
      const challenge = payuBLE.createChallenge({
        type: 'custom',
        formula: () => 'What has keys but cannot open locks?',
        validAnswers: ['piano', 'a piano', 'keyboard', 'computer keyboard'],
        caseInsensitive: true
      });

      // All valid answers should work
      expect(payuBLE.verifyAnswer('piano')).toBe(true);
      expect(payuBLE.verifyAnswer('a piano')).toBe(true);
      expect(payuBLE.verifyAnswer('keyboard')).toBe(true);
      expect(payuBLE.verifyAnswer('computer keyboard')).toBe(true);

      // Case insensitive
      expect(payuBLE.verifyAnswer('PIANO')).toBe(true);
      expect(payuBLE.verifyAnswer('Piano')).toBe(true);
      expect(payuBLE.verifyAnswer('KEYBOARD')).toBe(true);

      // Invalid answers
      expect(payuBLE.verifyAnswer('guitar')).toBe(false);
      expect(payuBLE.verifyAnswer('door')).toBe(false);
    });

    it('should handle case-sensitive validAnswers', () => {
      const challenge = payuBLE.createChallenge({
        type: 'custom',
        formula: () => 'Enter exactly: "CaseSensitive"',
        validAnswers: ['CaseSensitive', 'AnotherAnswer'],
        caseInsensitive: false
      });

      expect(payuBLE.verifyAnswer('CaseSensitive')).toBe(true);
      expect(payuBLE.verifyAnswer('AnotherAnswer')).toBe(true);

      expect(payuBLE.verifyAnswer('casesensitive')).toBe(false);
      expect(payuBLE.verifyAnswer('CASESENSITIVE')).toBe(false);
      expect(payuBLE.verifyAnswer('anotheranswer')).toBe(false);
    });

    it('should handle whitespace in validAnswers', () => {
      const challenge = payuBLE.createChallenge({
        type: 'custom',
        formula: () => 'Name a planet',
        validAnswers: ['Earth', 'Mars', 'Jupiter'],
        caseInsensitive: true
      });

      // Whitespace should be trimmed
      expect(payuBLE.verifyAnswer(' Earth ')).toBe(true);
      expect(payuBLE.verifyAnswer('  mars  ')).toBe(true);
      expect(payuBLE.verifyAnswer('\tJupiter\n')).toBe(true);
    });

    it('should handle complex riddle scenarios', () => {
      const challenge = payuBLE.createChallenge({
        type: 'custom',
        formula: () => 'I am not alive, but I grow; I don\'t have lungs, but I need air; I don\'t have a mouth, but water kills me. What am I?',
        validAnswers: ['fire', 'a fire', 'flame', 'a flame'],
        caseInsensitive: true
      });

      expect(payuBLE.verifyAnswer('fire')).toBe(true);
      expect(payuBLE.verifyAnswer('Fire')).toBe(true);
      expect(payuBLE.verifyAnswer('FIRE')).toBe(true);
      expect(payuBLE.verifyAnswer('a fire')).toBe(true);
      expect(payuBLE.verifyAnswer('flame')).toBe(true);
      expect(payuBLE.verifyAnswer('A FLAME')).toBe(true);

      expect(payuBLE.verifyAnswer('water')).toBe(false);
      expect(payuBLE.verifyAnswer('air')).toBe(false);
      expect(payuBLE.verifyAnswer('plant')).toBe(false);
    });

    it('should handle numerical answers in validAnswers', () => {
      const challenge = payuBLE.createChallenge({
        type: 'custom',
        formula: () => 'How many sides does a triangle have?',
        validAnswers: ['3', 'three', 'Three'],
        caseInsensitive: true
      });

      expect(payuBLE.verifyAnswer('3')).toBe(true);
      expect(payuBLE.verifyAnswer('three')).toBe(true);
      expect(payuBLE.verifyAnswer('THREE')).toBe(true);
      expect(payuBLE.verifyAnswer('Three')).toBe(true);

      expect(payuBLE.verifyAnswer('4')).toBe(false);
      expect(payuBLE.verifyAnswer('four')).toBe(false);
    });
  });

  describe('Availability Trigger Mocking', () => {
    it('should mock timeBased helper correctly', () => {
      const currentHour = new Date().getHours();
      
      // Mock function that returns true for current hour
      const mockTimeBased = (hours: number[]) => {
        return () => hours.includes(currentHour);
      };

      const availableNow = mockTimeBased([currentHour]);
      const notAvailableNow = mockTimeBased([currentHour === 23 ? 0 : currentHour + 1]);

      expect(availableNow()).toBe(true);
      expect(notAvailableNow()).toBe(false);

      // Test with PayuBLE device
      payuBLE.setBLEAvailability(availableNow);
      expect(payuBLE.isDeviceAvailable()).toBe(true);

      payuBLE.setBLEAvailability(notAvailableNow);
      expect(payuBLE.isDeviceAvailable()).toBe(false);
    });

    it('should mock complex availability conditions', () => {
      let mockButtonPressed = false;
      let mockUserPresent = false;
      let mockSecurityLevel = 1;

      const mockComplexTrigger = () => {
        return mockButtonPressed && mockUserPresent && mockSecurityLevel >= 2;
      };

      payuBLE.setBLEAvailability(mockComplexTrigger);

      // Initially not available
      expect(payuBLE.isDeviceAvailable()).toBe(false);

      // Button pressed, but user not present and security level too low
      mockButtonPressed = true;
      expect(payuBLE.isDeviceAvailable()).toBe(false);

      // User present, but security level still too low
      mockUserPresent = true;
      expect(payuBLE.isDeviceAvailable()).toBe(false);

      // All conditions met
      mockSecurityLevel = 2;
      expect(payuBLE.isDeviceAvailable()).toBe(true);

      // Remove one condition
      mockButtonPressed = false;
      expect(payuBLE.isDeviceAvailable()).toBe(false);
    });

    it('should handle dynamic availability changes', () => {
      let isAvailable = false;
      const dynamicTrigger = () => isAvailable;

      payuBLE.setBLEAvailability(dynamicTrigger);

      // Start unavailable
      expect(payuBLE.isDeviceAvailable()).toBe(false);

      // Become available
      isAvailable = true;
      expect(payuBLE.isDeviceAvailable()).toBe(true);

      // Back to unavailable
      isAvailable = false;
      expect(payuBLE.isDeviceAvailable()).toBe(false);
    });

    it('should mock schedule-based availability', () => {
      const mockScheduleAvailability = (currentTime: string, schedule: Array<{start: string, end: string}>) => {
        return () => {
          const [hours, minutes] = currentTime.split(':').map(Number);
          const currentMinutes = hours * 60 + minutes;

          return schedule.some(slot => {
            const [startHour, startMin] = slot.start.split(':').map(Number);
            const [endHour, endMin] = slot.end.split(':').map(Number);
            const startTime = startHour * 60 + startMin;
            const endTime = endHour * 60 + endMin;

            return currentMinutes >= startTime && currentMinutes <= endTime;
          });
        };
      };

      const schedule = [
        { start: '09:00', end: '12:00' },
        { start: '13:00', end: '17:00' }
      ];

      // Test during business hours
      const morningTrigger = mockScheduleAvailability('10:30', schedule);
      payuBLE.setBLEAvailability(morningTrigger);
      expect(payuBLE.isDeviceAvailable()).toBe(true);

      // Test during lunch break
      const lunchTrigger = mockScheduleAvailability('12:30', schedule);
      payuBLE.setBLEAvailability(lunchTrigger);
      expect(payuBLE.isDeviceAvailable()).toBe(false);

      // Test after hours
      const eveningTrigger = mockScheduleAvailability('19:00', schedule);
      payuBLE.setBLEAvailability(eveningTrigger);
      expect(payuBLE.isDeviceAvailable()).toBe(false);
    });

    it('should handle availability trigger exceptions', () => {
      const faultyTrigger = () => {
        throw new Error('Trigger malfunction');
      };

      payuBLE.setBLEAvailability(faultyTrigger);

      // Should not throw error, but return false
      expect(() => payuBLE.isDeviceAvailable()).not.toThrow();
      expect(payuBLE.isDeviceAvailable()).toBe(false);
    });

    it('should test real helpers.timeBased function', () => {
      const currentHour = new Date().getHours();
      
      // Test actual helper
      const timeBasedTrigger = helpers.timeBased([currentHour]);
      expect(timeBasedTrigger()).toBe(true);

      const wrongTimeTrigger = helpers.timeBased([currentHour === 23 ? 0 : currentHour + 1]);
      expect(wrongTimeTrigger()).toBe(false);

      // Test with multiple hours
      const multiHourTrigger = helpers.timeBased([currentHour, currentHour + 1, currentHour - 1]);
      expect(multiHourTrigger()).toBe(true);

      // Test with empty array
      const emptyTrigger = helpers.timeBased([]);
      expect(emptyTrigger()).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should handle challenge creation with availability check', () => {
      let deviceAvailable = true;
      payuBLE.setBLEAvailability(() => deviceAvailable);

      // Device available - should be able to create challenge
      expect(payuBLE.isDeviceAvailable()).toBe(true);
      
      const challenge = payuBLE.createChallenge({
        type: 'custom',
        formula: () => 'Device is available!',
        validAnswers: ['yes']
      });

      expect(challenge).toBeDefined();
      expect(payuBLE.verifyAnswer('yes')).toBe(true);

      // Make device unavailable
      deviceAvailable = false;
      expect(payuBLE.isDeviceAvailable()).toBe(false);

      // Challenge should still work if already created
      payuBLE.createChallenge({
        type: 'custom',
        formula: () => 'Still works',
        validAnswers: ['ok']
      });
      expect(payuBLE.verifyAnswer('ok')).toBe(true);
    });

    it('should handle multiple challenge types with TTL', async () => {
      // Test arithmetic with TTL
      payuBLE.createChallenge({
        type: 'arithmetic',
        difficulty: 1,
        ttl: 100
      });

      expect(payuBLE.getCurrentChallenge()?.type).toBe('arithmetic');
      
      await new Promise(resolve => setTimeout(resolve, 120));
      expect(() => payuBLE.verifyAnswer('5')).toThrow('Challenge has expired');

      // Test custom with TTL
      payuBLE.createChallenge({
        type: 'custom',
        formula: () => 'Quick test',
        validAnswers: ['test'],
        ttl: 50
      });

      expect(payuBLE.verifyAnswer('test')).toBe(true);
    });
  });
});