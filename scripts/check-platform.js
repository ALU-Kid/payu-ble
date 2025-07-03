#!/usr/bin/env node

/**
 * Platform compatibility check script
 * Runs after npm install to verify platform capabilities
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

function checkPlatformCapabilities() {
  const platform = os.platform();
  const arch = os.arch();
  const nodeVersion = process.version;
  
  console.log('\n🔍 PayuBLE Platform Check');
  console.log('========================');
  console.log(`Platform: ${platform}`);
  console.log(`Architecture: ${arch}`);
  console.log(`Node.js: ${nodeVersion}`);
  
  const capabilities = {
    gpio: false,
    networking: true,
    gps: true,
    ipGeolocation: true
  };
  
  // Check GPIO capability (Linux ARM/ARM64 typically indicates Raspberry Pi)
  if (platform === 'linux' && (arch === 'arm' || arch === 'arm64')) {
    // Check for GPIO access
    try {
      if (fs.existsSync('/sys/class/gpio')) {
        capabilities.gpio = true;
        console.log('✅ GPIO support detected (Raspberry Pi/similar)');
      }
    } catch (error) {
      console.log('⚠️  GPIO hardware detected but access may be limited');
    }
  } else {
    console.log('ℹ️  GPIO support not available on this platform');
  }
  
  // Check network tools
  const { exec } = require('child_process');
  
  exec('arp -a', (error) => {
    if (error) {
      console.log('⚠️  ARP command not available - network MAC detection may be limited');
      capabilities.networking = false;
    } else {
      console.log('✅ Network detection capabilities available');
    }
  });
  
  // Check optional dependencies
  const optionalDeps = [
    { name: 'onoff', feature: 'GPIO', platform: 'linux' },
    { name: 'arp-a', feature: 'Network MAC detection', platform: 'all' },
    { name: 'ping', feature: 'Network ping', platform: 'all' },
    { name: 'node-fetch', feature: 'IP geolocation', platform: 'all' }
  ];
  
  console.log('\n📦 Optional Dependencies:');
  
  optionalDeps.forEach(dep => {
    try {
      require.resolve(dep.name);
      console.log(`✅ ${dep.name} - ${dep.feature} available`);
    } catch (error) {
      if (dep.platform === 'all' || dep.platform === platform) {
        console.log(`⚠️  ${dep.name} - ${dep.feature} not available`);
        console.log(`   Install with: npm install ${dep.name}`);
      } else {
        console.log(`ℹ️  ${dep.name} - Not needed on ${platform}`);
      }
    }
  });
  
  // Platform-specific recommendations
  console.log('\n💡 Recommendations:');
  
  if (platform === 'linux' && (arch === 'arm' || arch === 'arm64')) {
    console.log('🍓 Raspberry Pi detected:');
    console.log('   - Enable GPIO interface: sudo raspi-config');
    console.log('   - Add user to gpio group: sudo usermod -a -G gpio $USER');
    console.log('   - Install full platform support: npm install onoff arp-a ping node-fetch');
  } else if (platform === 'darwin') {
    console.log('🍎 macOS detected:');
    console.log('   - Network features available');
    console.log('   - Install network tools: brew install arp-scan');
    console.log('   - Install deps: npm install arp-a ping node-fetch');
  } else if (platform === 'win32') {
    console.log('🪟 Windows detected:');
    console.log('   - Limited network detection (may require admin privileges)');
    console.log('   - Install deps: npm install ping node-fetch');
  } else {
    console.log(`🐧 ${platform} detected:`);
    console.log('   - Install network tools for full functionality');
    console.log('   - Install deps: npm install arp-a ping node-fetch');
  }
  
  // Check for demo requirements
  console.log('\n🌐 Browser Demo:');
  if (platform === 'win32') {
    console.log('   Run: python -m http.server 8000 (in demo/browser/)');
  } else {
    console.log('   Run: npm run demo:browser');
  }
  console.log('   Requires: Chrome/Edge/Opera with Web Bluetooth support');
  
  // Write capability info for runtime use
  const capabilityFile = path.join(__dirname, '..', 'platform-capabilities.json');
  try {
    fs.writeFileSync(capabilityFile, JSON.stringify({
      platform,
      arch,
      nodeVersion,
      capabilities,
      timestamp: new Date().toISOString()
    }, null, 2));
  } catch (error) {
    // Ignore write errors
  }
  
  console.log('\n🚀 PayuBLE is ready to use!');
  console.log('   Run examples: npm run demo:math');
  console.log('   View docs: check docs/ folder');
  console.log('   Run tests: npm test\n');
}

// Only run if called directly (not required)
if (require.main === module) {
  checkPlatformCapabilities();
}

module.exports = checkPlatformCapabilities;