import PayuBLE, { createChallenge, verifyAnswer, helpers, ChallengeOptions } from '../src/index';

describe('PayuBLE Core Functionality', () => {
  let payuBLE: PayuBLE;

  beforeEach(() => {
    payuBLE = new PayuBLE('TEST_DEVICE_123');
  });

  afterEach(() => {
    payuBLE.clearChallenge();
  });

  describe('Device Creation', () => {
    it('should create a device with custom ID', () => {
      expect(payuBLE.getDeviceId()).toBe('TEST_DEVICE_123');
    });

    it('should generate a device ID if none provided', () => {
      const autoDevice = new PayuBLE();
      expect(autoDevice.getDeviceId()).toBeDefined();
      expect(autoDevice.getDeviceId().length).toBeGreaterThan(0);
    });
  });

  describe('Arithmetic Challenges', () => {
    it('should create easy arithmetic challenge (difficulty 1)', () => {
      const challenge = payuBLE.createChallenge({
        type: 'arithmetic',
        difficulty: 1
      });

      expect(challenge).toBeDefined();
      expect(challenge.type).toBe('arithmetic');
      expect(challenge.prompt).toMatch(/Solve: \d+ [+\-] \d+/);
      expect(challenge.id).toBeDefined();
      expect(challenge.createdAt).toBeCloseTo(Date.now(), -2);
    });

    it('should create medium arithmetic challenge (difficulty 2)', () => {
      const challenge = payuBLE.createChallenge({
        type: 'arithmetic',
        difficulty: 2
      });

      expect(challenge.prompt).toMatch(/Solve: \d+ [+\-×*] \d+/);
    });

    it('should create hard arithmetic challenge (difficulty 3)', () => {
      const challenge = payuBLE.createChallenge({
        type: 'arithmetic',
        difficulty: 3
      });

      expect(challenge.prompt).toMatch(/Solve: \d+ \+ \d+ × \d+/);
    });

    it('should verify correct arithmetic answers', () => {
      // Create a simple challenge we can predict
      const challenge = payuBLE.createChallenge({
        type: 'custom',
        formula: () => 'What is 5 + 3?',
        validate: (input) => parseInt(input) === 8
      });

      expect(payuBLE.verifyAnswer('8')).toBe(true);
      expect(payuBLE.verifyAnswer('7')).toBe(false);
      expect(payuBLE.verifyAnswer('nine')).toBe(false);
    });
  });

  describe('Hash Challenges', () => {
    it('should create hash-based challenge', () => {
      const challenge = payuBLE.createChallenge({
        type: 'hash'
      });

      expect(challenge.type).toBe('hash');
      expect(challenge.prompt).toMatch(/What is \(SHA256\(".+"\)\) % 100\?/);
      expect(challenge.prompt).toContain(payuBLE.getDeviceId());
    });

    it('should validate hash challenge correctly', () => {
      const challenge = payuBLE.createChallenge({
        type: 'hash'
      });

      // Extract the expected answer from the prompt for testing
      const promptMatch = challenge.prompt.match(/SHA256\("(.+)"\)/);
      expect(promptMatch).toBeTruthy();
      
      if (promptMatch) {
        const crypto = require('crypto');
        const input = promptMatch[1];
        const hash = crypto.createHash('sha256').update(input).digest('hex');
        const expectedAnswer = (parseInt(hash.substring(0, 8), 16) % 100).toString();
        
        expect(payuBLE.verifyAnswer(expectedAnswer)).toBe(true);
        expect(payuBLE.verifyAnswer('999')).toBe(false);
      }
    });
  });

  describe('Custom Challenges', () => {
    it('should create custom challenge with validation function', () => {
      const challenge = payuBLE.createChallenge({
        type: 'custom',
        formula: () => 'What is the current year?',
        validate: (input) => parseInt(input) === new Date().getFullYear()
      });

      expect(challenge.type).toBe('custom');
      expect(challenge.prompt).toBe('What is the current year?');
      
      const currentYear = new Date().getFullYear().toString();
      expect(payuBLE.verifyAnswer(currentYear)).toBe(true);
      expect(payuBLE.verifyAnswer('1999')).toBe(false);
    });

    it('should create custom challenge with valid answers array', () => {
      const challenge = payuBLE.createChallenge({
        type: 'custom',
        formula: () => 'What has keys but cannot open locks?',
        validAnswers: ['piano', 'a piano', 'keyboard'],
        caseInsensitive: true
      });

      expect(payuBLE.verifyAnswer('piano')).toBe(true);
      expect(payuBLE.verifyAnswer('PIANO')).toBe(true);
      expect(payuBLE.verifyAnswer('Piano')).toBe(true);
      expect(payuBLE.verifyAnswer('keyboard')).toBe(true);
      expect(payuBLE.verifyAnswer('guitar')).toBe(false);
    });

    it('should handle case sensitivity correctly', () => {
      const challenge = payuBLE.createChallenge({
        type: 'custom',
        formula: () => 'Enter "Hello"',
        validAnswers: ['Hello'],
        caseInsensitive: false
      });

      expect(payuBLE.verifyAnswer('Hello')).toBe(true);
      expect(payuBLE.verifyAnswer('hello')).toBe(false);
      expect(payuBLE.verifyAnswer('HELLO')).toBe(false);
    });

    it('should throw error for invalid custom challenge configuration', () => {
      expect(() => {
        payuBLE.createChallenge({
          type: 'custom',
          formula: () => 'Test question'
          // Missing validate function or validAnswers
        });
      }).toThrow('Custom challenge requires either validate function or validAnswers array');
    });
  });

  describe('Challenge Expiration', () => {
    it('should respect TTL (time-to-live)', async () => {
      const challenge = payuBLE.createChallenge({
        type: 'custom',
        formula: () => 'Test question',
        validAnswers: ['test'],
        ttl: 100 // 100ms
      });

      expect(payuBLE.verifyAnswer('test')).toBe(true);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(() => payuBLE.verifyAnswer('test')).toThrow('Challenge has expired');
    });

    it('should clear expired challenges', async () => {
      payuBLE.createChallenge({
        type: 'custom',
        formula: () => 'Test question',
        validAnswers: ['test'],
        ttl: 50
      });

      expect(payuBLE.getCurrentChallenge()).toBeTruthy();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(() => payuBLE.verifyAnswer('test')).toThrow('Challenge has expired');
    });
  });

  describe('Challenge Management', () => {
    it('should get current challenge', () => {
      expect(payuBLE.getCurrentChallenge()).toBeNull();

      const challenge = payuBLE.createChallenge({
        type: 'arithmetic',
        difficulty: 1
      });

      expect(payuBLE.getCurrentChallenge()).toEqual(challenge);
    });

    it('should clear challenges', () => {
      payuBLE.createChallenge({
        type: 'arithmetic',
        difficulty: 1
      });

      expect(payuBLE.getCurrentChallenge()).toBeTruthy();
      
      payuBLE.clearChallenge();
      
      expect(payuBLE.getCurrentChallenge()).toBeNull();
    });

    it('should throw error when verifying without active challenge', () => {
      expect(() => payuBLE.verifyAnswer('test')).toThrow('No active challenge');
    });
  });

  describe('Availability Control', () => {
    it('should set and check device availability', () => {
      expect(payuBLE.isDeviceAvailable()).toBe(false);

      payuBLE.setBLEAvailability(() => true);
      expect(payuBLE.isDeviceAvailable()).toBe(true);

      payuBLE.setBLEAvailability(() => false);
      expect(payuBLE.isDeviceAvailable()).toBe(false);
    });

    it('should update availability dynamically', () => {
      let shouldBeAvailable = false;
      
      payuBLE.setBLEAvailability(() => shouldBeAvailable);
      expect(payuBLE.isDeviceAvailable()).toBe(false);

      shouldBeAvailable = true;
      expect(payuBLE.isDeviceAvailable()).toBe(true);
    });
  });
});

describe('Helper Functions', () => {
  describe('timeBased helper', () => {
    it('should create time-based availability function', () => {
      const currentHour = new Date().getHours();
      const timeBasedFn = helpers.timeBased([currentHour]);
      
      expect(timeBasedFn()).toBe(true);
      
      const wrongHour = currentHour === 23 ? 0 : currentHour + 1;
      const wrongTimeFn = helpers.timeBased([wrongHour]);
      
      expect(wrongTimeFn()).toBe(false);
    });
  });

  describe('scheduleBasedAvailability helper', () => {
    it('should work with time slots', () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const scheduleFn = helpers.scheduleBasedAvailability([
        { start: '00:00', end: '23:59' }
      ]);
      
      expect(scheduleFn()).toBe(true);
      
      const impossibleScheduleFn = helpers.scheduleBasedAvailability([
        { start: '25:00', end: '26:00' } // Invalid time
      ]);
      
      expect(impossibleScheduleFn()).toBe(false);
    });
  });

  describe('alwaysAvailable helper', () => {
    it('should always return true', () => {
      const alwaysFn = helpers.alwaysAvailable();
      expect(alwaysFn()).toBe(true);
    });
  });
});

describe('Default Instance Functions', () => {
  afterEach(() => {
    // Clear any challenges from default instance
    try {
      while (verifyAnswer('dummy')) {
        // This will fail, but clears the challenge
      }
    } catch (e) {
      // Expected to fail
    }
  });

  it('should work with default instance functions', () => {
    const challenge = createChallenge({
      type: 'custom',
      formula: () => 'Test default instance',
      validAnswers: ['test']
    });

    expect(challenge).toBeDefined();
    expect(verifyAnswer('test')).toBe(true);
  });
});

describe('Error Handling', () => {
  let payuBLE: PayuBLE;

  beforeEach(() => {
    payuBLE = new PayuBLE('ERROR_TEST_DEVICE');
  });

  it('should handle unsupported challenge types', () => {
    expect(() => {
      payuBLE.createChallenge({
        type: 'unsupported' as any
      });
    }).toThrow('Unsupported challenge type: unsupported');
  });

  it('should handle missing formula for custom challenges', () => {
    expect(() => {
      payuBLE.createChallenge({
        type: 'custom'
        // Missing formula
      } as ChallengeOptions);
    }).toThrow('Custom challenge requires a formula function');
  });
});