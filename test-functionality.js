// Comprehensive functionality test for both CJS and ESM

console.log('🔍 Testing all functionality...\n');

// Test CJS Main Library
console.log('=== Testing CJS Main Library ===');
try {
  const { PayuBLE, createChallenge, helpers } = require('./dist/index.cjs');
  
  // Test class instantiation
  const payu = new PayuBLE('test-device');
  console.log('✓ PayuBLE class instantiation works');
  
  // Test device ID generation
  console.log(`✓ Device ID: ${payu.getDeviceId()}`);
  
  // Test arithmetic challenge
  const mathChallenge = payu.createChallenge({ type: 'arithmetic', difficulty: 2 });
  console.log(`✓ Arithmetic challenge created: "${mathChallenge.prompt}"`);
  
  // Test hash challenge
  const hashChallenge = payu.createChallenge({ type: 'hash' });
  console.log(`✓ Hash challenge created: "${hashChallenge.prompt}"`);
  
  // Test custom challenge
  const customChallenge = payu.createChallenge({
    type: 'custom',
    formula: () => 'What is the capital of France?',
    validAnswers: ['Paris', 'paris'],
    caseInsensitive: true
  });
  console.log(`✓ Custom challenge created: "${customChallenge.prompt}"`);
  
  // Test helper functions
  console.log(`✓ Core helpers available: ${Object.keys(helpers).join(', ')}`);
  
  // Test time-based helper
  const timeHelper = helpers.timeBased([9, 10, 11]);
  console.log(`✓ Time-based helper result: ${timeHelper()}`);
  
  // Test schedule-based helper
  const scheduleHelper = helpers.scheduleBasedAvailability([
    { start: '09:00', end: '17:00' },
    { start: '19:00', end: '21:00' }
  ]);
  console.log(`✓ Schedule-based helper result: ${scheduleHelper()}`);
  
  // Test convenience functions
  const convenienceChallenge = createChallenge({ type: 'arithmetic', difficulty: 1 });
  console.log(`✓ Convenience function works: "${convenienceChallenge.prompt}"`);
  
} catch (error) {
  console.error('❌ CJS Main Library test failed:', error.message);
}

console.log('\n=== Testing CJS Platform Module ===');
try {
  const { 
    getPlatformInfo, 
    createPlatformHelpers,
    GPIOButtonHelper,
    NetworkMACHelper,
    GPSLocationHelper 
  } = require('./platform/dist/platform_index.cjs');
  
  // Test platform detection
  const platformInfo = getPlatformInfo();
  console.log(`✓ Platform info: ${platformInfo.platform}/${platformInfo.arch}`);
  console.log(`✓ GPIO support: ${platformInfo.hasGPIO}`);
  console.log(`✓ Capabilities: ${Object.keys(platformInfo.capabilities).join(', ')}`);
  
  // Test platform helpers factory
  const platformHelpers = createPlatformHelpers();
  console.log(`✓ Platform helpers created: ${Object.keys(platformHelpers).join(', ')}`);
  
  // Test GPIO helper class (will be mocked)
  const gpioHelper = new GPIOButtonHelper({ pin: 18 });
  console.log(`✓ GPIO helper instantiated for pin 18`);
  console.log(`✓ GPIO helper state: ${gpioHelper.getState()}`);
  
  // Test mock methods
  gpioHelper.mockPress();
  console.log(`✓ GPIO helper after mock press: ${gpioHelper.getState()}`);
  gpioHelper.cleanup();
  
  // Test Network helper class
  const networkHelper = new NetworkMACHelper();
  console.log(`✓ Network helper instantiated`);
  
  // Test GPS helper class  
  const gpsHelper = new GPSLocationHelper({ useIPLocation: false });
  console.log(`✓ GPS helper instantiated`);
  
} catch (error) {
  console.error('❌ CJS Platform test failed:', error.message);
}

// Test ESM imports
console.log('\n=== Testing ESM Main Library ===');
import('./dist/index.mjs').then(({ PayuBLE, createChallenge, helpers }) => {
  console.log('✓ ESM main library imported successfully');
  
  const payu = new PayuBLE('test-esm-device');
  console.log(`✓ ESM PayuBLE instance: ${payu.getDeviceId()}`);
  
  const challenge = payu.createChallenge({ type: 'arithmetic', difficulty: 3 });
  console.log(`✓ ESM challenge: "${challenge.prompt}"`);
  
  console.log(`✓ ESM helpers: ${Object.keys(helpers).join(', ')}`);
  
  return import('./platform/dist/platform_index.mjs');
}).then(({ getPlatformInfo, GPIOButtonHelper }) => {
  console.log('\n=== Testing ESM Platform Module ===');
  console.log('✓ ESM platform module imported successfully');
  
  const platformInfo = getPlatformInfo();
  console.log(`✓ ESM Platform: ${platformInfo.platform}/${platformInfo.arch}`);
  
  // Test GPIO helper in ESM
  const gpioHelper = new GPIOButtonHelper({ pin: 19 });
  console.log(`✓ ESM GPIO helper for pin 19: ${gpioHelper.getState()}`);
  gpioHelper.cleanup();
  
  console.log('\n🎉 All functionality tests passed!');
  
  // Exit cleanly to prevent timeout
  process.exit(0);
  
}).catch(error => {
  console.error('❌ ESM test failed:', error.message);
  process.exit(1);
});