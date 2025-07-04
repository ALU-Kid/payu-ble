// Simple ESM test
console.log('Testing ESM imports...');

try {
  const { PayuBLE } = await import('./dist/index.mjs');
  console.log('✓ Main ESM import works');
  
  const { getPlatformInfo } = await import('./platform/dist/platform_index.mjs');
  console.log('✓ Platform ESM import works');
  
  const platformInfo = getPlatformInfo();
  console.log(`✓ Platform: ${platformInfo.platform}/${platformInfo.arch}`);
  
} catch (error) {
  console.error('❌ ESM test failed:', error.message);
  console.error('Stack:', error.stack);
}