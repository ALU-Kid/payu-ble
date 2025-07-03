#!/usr/bin/env node

const { PayuBLE, helpers } = require('../dist/index');

console.log('🔗 PayuBLE Availability Controls Demo\n');

// Create devices for different scenarios
const officeDevice = new PayuBLE('OFFICE_PRINTER_001');
const gameDevice = new PayuBLE('GAME_CONSOLE_002');
const secureDevice = new PayuBLE('SECURE_VAULT_003');

async function demonstrateTimeBasedAvailability() {
  console.log('--- Time-Based Availability Demo ---\n');

  const currentHour = new Date().getHours();
  console.log(`Current time: ${new Date().toLocaleTimeString()}`);
  console.log(`Current hour: ${currentHour}\n`);

  // Business hours only
  console.log('📅 Business Hours Device (9 AM - 5 PM):');
  const businessHours = helpers.timeBased([9, 10, 11, 12, 13, 14, 15, 16, 17]);
  officeDevice.setBLEAvailability(businessHours);
  
  console.log(`   Status: ${officeDevice.isDeviceAvailable() ? '🟢 AVAILABLE' : '🔴 UNAVAILABLE'}`);
  
  if (officeDevice.isDeviceAvailable()) {
    console.log('   ✅ Device is advertising - office staff can connect');
    
    // Create a work-appropriate challenge
    const workChallenge = officeDevice.createChallenge({
      type: 'custom',
      formula: () => 'What is the office WiFi password?',
      validAnswers: ['OfficeWiFi2024', 'CompanyGuest'],
      caseInsensitive: true
    });
    
    console.log(`   Challenge: "${workChallenge.prompt}"`);
    
    // Simulate correct answer
    try {
      const result = officeDevice.verifyAnswer('OfficeWiFi2024');
      console.log(`   Test answer "OfficeWiFi2024": ${result ? '✅ CORRECT' : '❌ INCORRECT'}`);
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }
  } else {
    console.log('   ❌ Device is hidden - outside business hours');
  }

  // Late night gaming hours
  console.log('\n🎮 Gaming Device (8 PM - 2 AM):');
  const gamingHours = helpers.timeBased([20, 21, 22, 23, 0, 1, 2]);
  gameDevice.setBLEAvailability(gamingHours);
  
  console.log(`   Status: ${gameDevice.isDeviceAvailable() ? '🟢 AVAILABLE' : '🔴 UNAVAILABLE'}`);
  
  if (gameDevice.isDeviceAvailable()) {
    console.log('   🎯 Ready for gaming sessions');
    
    const gameChallenge = gameDevice.createChallenge({
      type: 'custom',
      formula: () => 'What is the highest score in our leaderboard?',
      validate: (input) => {
        const score = parseInt(input);
        return !isNaN(score) && score >= 50000 && score <= 999999;
      }
    });
    
    console.log(`   Challenge: "${gameChallenge.prompt}"`);
    
    // Test with various scores
    const testScores = ['75000', '25000', '1000000', 'abc'];
    testScores.forEach(score => {
      try {
        const result = gameDevice.verifyAnswer(score);
        console.log(`   Test score "${score}": ${result ? '✅ VALID' : '❌ INVALID'}`);
      } catch (error) {
        console.log(`   Test score "${score}": ❌ ERROR`);
      }
    });
  } else {
    console.log('   😴 Gaming device is sleeping');
  }

  // Always available
  console.log('\n🔒 Secure Device (Always Available):');
  secureDevice.setBLEAvailability(helpers.alwaysAvailable());
  
  console.log(`   Status: ${secureDevice.isDeviceAvailable() ? '🟢 AVAILABLE' : '🔴 UNAVAILABLE'}`);
  console.log('   🛡️ Always ready for authenticated access');
  
  const secureChallenge = secureDevice.createChallenge({
    type: 'hash'
  });
  
  console.log(`   Challenge: "${secureChallenge.prompt}"`);
}

async function demonstrateScheduleBasedAvailability() {
  console.log('\n\n--- Schedule-Based Availability Demo ---\n');

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  console.log(`Current time: ${currentTime}\n`);

  // Office schedule with lunch break
  console.log('🏢 Office Device with Lunch Break:');
  const officeSchedule = helpers.scheduleBasedAvailability([
    { start: '09:00', end: '12:00' },  // Morning
    { start: '13:00', end: '17:00' }   // Afternoon (lunch break 12-13)
  ]);
  
  const scheduleDevice = new PayuBLE('SCHEDULE_DEMO_001');
  scheduleDevice.setBLEAvailability(officeSchedule);
  
  console.log('   Schedule: 9:00-12:00, 13:00-17:00');
  console.log(`   Status: ${scheduleDevice.isDeviceAvailable() ? '🟢 AVAILABLE' : '🔴 UNAVAILABLE'}`);
  
  // Test different times
  const testTimes = [
    { time: '08:30', description: 'Before work' },
    { time: '10:30', description: 'Morning work' },
    { time: '12:30', description: 'Lunch break' },
    { time: '15:30', description: 'Afternoon work' },
    { time: '18:30', description: 'After work' }
  ];

  console.log('\n   Availability at different times:');
  testTimes.forEach(test => {
    const [hour, minute] = test.time.split(':').map(Number);
    const testTime = hour * 60 + minute;
    
    // Check if time falls in any schedule slot
    const schedule = [
      { start: '09:00', end: '12:00' },
      { start: '13:00', end: '17:00' }
    ];
    
    const isAvailable = schedule.some(slot => {
      const [startHour, startMin] = slot.start.split(':').map(Number);
      const [endHour, endMin] = slot.end.split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;
      
      return testTime >= startTime && testTime <= endTime;
    });
    
    console.log(`     ${test.time} (${test.description}): ${isAvailable ? '🟢' : '🔴'}`);
  });

  // If currently available, create a schedule-appropriate challenge
  if (scheduleDevice.isDeviceAvailable()) {
    const workChallenge = scheduleDevice.createChallenge({
      type: 'custom',
      formula: () => 'Enter your department code:',
      validAnswers: ['ENG', 'HR', 'SALES', 'MARKETING', 'IT'],
      caseInsensitive: true
    });
    
    console.log(`\n   Work Challenge: "${workChallenge.prompt}"`);
    
    ['ENG', 'hr', 'Finance', 'SALES'].forEach(dept => {
      try {
        const result = scheduleDevice.verifyAnswer(dept);
        console.log(`     Department "${dept}": ${result ? '✅ VALID' : '❌ INVALID'}`);
      } catch (error) {
        console.log(`     Department "${dept}": ❌ ERROR`);
      }
    });
  }
}

async function demonstrateCustomAvailability() {
  console.log('\n\n--- Custom Availability Logic Demo ---\n');

  // Weekdays only device
  console.log('📅 Weekdays Only Device:');
  const weekdayDevice = new PayuBLE('WEEKDAY_ONLY_001');
  weekdayDevice.setBLEAvailability(() => {
    const day = new Date().getDay();
    return day >= 1 && day <= 5; // Monday = 1, Friday = 5
  });

  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  console.log(`   Today is: ${dayNames[today.getDay()]}`);
  console.log(`   Status: ${weekdayDevice.isDeviceAvailable() ? '🟢 AVAILABLE (Weekday)' : '🔴 UNAVAILABLE (Weekend)'}`);

  if (weekdayDevice.isDeviceAvailable()) {
    const weekdayChallenge = weekdayDevice.createChallenge({
      type: 'arithmetic',
      difficulty: 2
    });
    console.log(`   Weekday Challenge: "${weekdayChallenge.prompt}"`);
  }

  // Multi-factor availability simulation
  console.log('\n🔐 Multi-Factor Security Device:');
  const multiFactorDevice = new PayuBLE('MULTI_FACTOR_001');
  
  // Simulate various security conditions
  let securityConditions = {
    validTime: helpers.timeBased([new Date().getHours()])(),
    userAuthenticated: Math.random() > 0.3, // 70% chance user is authenticated
    securityLevelGreen: Math.random() > 0.2, // 80% chance security is green
    adminOverride: false
  };

  multiFactorDevice.setBLEAvailability(() => {
    return securityConditions.validTime && 
           (securityConditions.userAuthenticated && securityConditions.securityLevelGreen) ||
           securityConditions.adminOverride;
  });

  console.log('   Security Conditions:');
  console.log(`     Valid Time: ${securityConditions.validTime ? '✅' : '❌'}`);
  console.log(`     User Authenticated: ${securityConditions.userAuthenticated ? '✅' : '❌'}`);
  console.log(`     Security Level Green: ${securityConditions.securityLevelGreen ? '✅' : '❌'}`);
  console.log(`     Admin Override: ${securityConditions.adminOverride ? '✅' : '❌'}`);
  console.log(`   Overall Status: ${multiFactorDevice.isDeviceAvailable() ? '🟢 AVAILABLE' : '🔴 UNAVAILABLE'}`);

  // Simulate changing conditions
  console.log('\n   Simulating security condition changes:');
  
  for (let i = 1; i <= 3; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Randomly change conditions
    if (Math.random() > 0.5) {
      securityConditions.userAuthenticated = !securityConditions.userAuthenticated;
      console.log(`     Step ${i}: User authentication ${securityConditions.userAuthenticated ? 'restored' : 'lost'}`);
    }
    
    if (Math.random() > 0.7) {
      securityConditions.securityLevelGreen = !securityConditions.securityLevelGreen;
      console.log(`     Step ${i}: Security level ${securityConditions.securityLevelGreen ? 'green' : 'elevated'}`);
    }
    
    console.log(`     Step ${i}: Device ${multiFactorDevice.isDeviceAvailable() ? '🟢 AVAILABLE' : '🔴 UNAVAILABLE'}`);
  }

  // Demonstrate admin override
  if (!multiFactorDevice.isDeviceAvailable()) {
    console.log('\n   🚨 Activating admin override...');
    securityConditions.adminOverride = true;
    console.log(`   Admin Override Status: ${multiFactorDevice.isDeviceAvailable() ? '🟢 AVAILABLE' : '🔴 UNAVAILABLE'}`);
  }

  // Random availability (50% chance)
  console.log('\n🎲 Random Availability Device (50% chance):');
  const randomDevice = new PayuBLE('RANDOM_001');
  let randomState = Math.random() > 0.5;
  randomDevice.setBLEAvailability(() => randomState);
  
  console.log(`   Status: ${randomDevice.isDeviceAvailable() ? '🟢 AVAILABLE (Lucky!)' : '🔴 UNAVAILABLE (Try again)'}`);

  // Simulate state changes
  console.log('\n   Simulating random state changes:');
  for (let i = 0; i < 5; i++) {
    randomState = Math.random() > 0.5;
    const status = randomDevice.isDeviceAvailable() ? '🟢' : '🔴';
    console.log(`     Attempt ${i + 1}: ${status}`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Load-based availability
  console.log('\n💻 Load-Based Availability (Simulated):');
  const loadDevice = new PayuBLE('LOAD_MONITOR_001');
  
  let simulatedLoad = 0;
  loadDevice.setBLEAvailability(() => {
    // Simulate system load between 0-100%
    simulatedLoad = Math.floor(Math.random() * 100);
    return simulatedLoad < 80; // Available only when load < 80%
  });

  console.log('   Monitoring system load...');
  for (let i = 0; i < 5; i++) {
    const isAvailable = loadDevice.isDeviceAvailable();
    const status = isAvailable ? '🟢 AVAILABLE' : '🔴 BUSY';
    console.log(`     Load: ${simulatedLoad}% - ${status}`);
    await new Promise(resolve => setTimeout(resolve, 800));
  }
}

async function demonstrateConditionalChallenges() {
  console.log('\n\n--- Conditional Challenge Creation ---\n');

  console.log('🔐 Smart Security Device:');
  console.log('   - Creates challenges only when available');
  console.log('   - Different challenge types based on time of day\n');

  const smartDevice = new PayuBLE('SMART_SECURITY_001');
  
  // Set availability to current hour for demo
  const currentHour = new Date().getHours();
  smartDevice.setBLEAvailability(helpers.timeBased([currentHour]));

  if (smartDevice.isDeviceAvailable()) {
    console.log('✅ Device is available - creating challenge...');
    
    // Create different challenges based on time
    let challengeType;
    if (currentHour >= 9 && currentHour <= 17) {
      challengeType = 'business';
    } else if (currentHour >= 18 && currentHour <= 22) {
      challengeType = 'evening';
    } else {
      challengeType = 'secure';
    }

    let challenge;
    switch (challengeType) {
      case 'business':
        challenge = smartDevice.createChallenge({
          type: 'arithmetic',
          difficulty: 2
        });
        console.log(`📊 Business hours - Medium math challenge: ${challenge.prompt}`);
        
        // Simulate solving
        try {
          // For demo, we'll try a few common answers
          const testAnswers = ['10', '20', '25', '30'];
          for (const answer of testAnswers) {
            try {
              const result = smartDevice.verifyAnswer(answer);
              if (result) {
                console.log(`   ✅ Solved with answer: ${answer}`);
                break;
              }
            } catch (error) {
              // Continue trying
            }
          }
        } catch (error) {
          console.log(`   Challenge active, waiting for correct answer...`);
        }
        break;
        
      case 'evening':
        challenge = smartDevice.createChallenge({
          type: 'custom',
          formula: () => 'What\'s the magic word?',
          validAnswers: ['please', 'abracadabra', 'open sesame'],
          caseInsensitive: true
        });
        console.log(`🌙 Evening hours - Fun riddle: ${challenge.prompt}`);
        
        // Test the riddle answers
        ['please', 'ABRACADABRA', 'wrong'].forEach(answer => {
          try {
            const result = smartDevice.verifyAnswer(answer);
            console.log(`   Answer "${answer}": ${result ? '✅ CORRECT' : '❌ INCORRECT'}`);
          } catch (error) {
            console.log(`   Answer "${answer}": ❌ ERROR`);
          }
        });
        break;
        
      case 'secure':
        challenge = smartDevice.createChallenge({
          type: 'hash'
        });
        console.log(`🔒 Secure hours - Cryptographic challenge: ${challenge.prompt}`);
        
        // For hash challenges, we can solve them programmatically
        const crypto = require('crypto');
        const match = challenge.prompt.match(/SHA256\("(.+)"\)/);
        if (match) {
          const input = match[1];
          const hash = crypto.createHash('sha256').update(input).digest('hex');
          const correctAnswer = (parseInt(hash.substring(0, 8), 16) % 100).toString();
          
          try {
            const result = smartDevice.verifyAnswer(correctAnswer);
            console.log(`   Computed answer "${correctAnswer}": ${result ? '✅ CORRECT' : '❌ INCORRECT'}`);
          } catch (error) {
            console.log(`   Error verifying computed answer: ${error.message}`);
          }
        }
        break;
    }

    console.log(`   Challenge ID: ${challenge.id}`);
    console.log(`   Created at: ${new Date(challenge.createdAt).toLocaleTimeString()}`);
    
  } else {
    console.log('❌ Device is not available - no challenge created');
    console.log('   Device will become available during configured hours');
  }
}

async function demonstrateAdvancedAvailability() {
  console.log('\n\n--- Advanced Availability Patterns ---\n');

  // Cascading availability
  console.log('🌊 Cascading Availability (Primary -> Backup):');
  const primaryDevice = new PayuBLE('PRIMARY_001');
  const backupDevice = new PayuBLE('BACKUP_001');
  
  let primaryOnline = Math.random() > 0.4; // 60% chance primary is online
  let backupOnline = true; // Backup is always online
  
  primaryDevice.setBLEAvailability(() => primaryOnline);
  backupDevice.setBLEAvailability(() => !primaryOnline && backupOnline);
  
  console.log(`   Primary Device: ${primaryDevice.isDeviceAvailable() ? '🟢 ONLINE' : '🔴 OFFLINE'}`);
  console.log(`   Backup Device: ${backupDevice.isDeviceAvailable() ? '🟢 ACTIVE' : '⏸️  STANDBY'}`);
  
  if (primaryDevice.isDeviceAvailable()) {
    const challenge = primaryDevice.createChallenge({
      type: 'custom',
      formula: () => 'Primary system access - Enter admin code:',
      validAnswers: ['ADMIN123', 'PRIMARY'],
      caseInsensitive: true
    });
    console.log(`   Primary Challenge: "${challenge.prompt}"`);
  } else if (backupDevice.isDeviceAvailable()) {
    const challenge = backupDevice.createChallenge({
      type: 'custom',
      formula: () => 'Backup system activated - Enter emergency code:',
      validAnswers: ['EMERGENCY', 'BACKUP999'],
      caseInsensitive: true
    });
    console.log(`   Backup Challenge: "${challenge.prompt}"`);
  }

  // Time-limited emergency access
  console.log('\n⏰ Time-Limited Emergency Access:');
  const emergencyDevice = new PayuBLE('EMERGENCY_001');
  const emergencyStartTime = Date.now();
  const emergencyDuration = 30000; // 30 seconds
  
  emergencyDevice.setBLEAvailability(() => {
    const elapsed = Date.now() - emergencyStartTime;
    return elapsed <= emergencyDuration;
  });
  
  console.log('   🚨 Emergency access activated for 30 seconds...');
  console.log(`   Status: ${emergencyDevice.isDeviceAvailable() ? '🟢 EMERGENCY ACCESS ACTIVE' : '🔴 ACCESS EXPIRED'}`);
  
  if (emergencyDevice.isDeviceAvailable()) {
    const emergencyChallenge = emergencyDevice.createChallenge({
      type: 'custom',
      formula: () => 'EMERGENCY ACCESS - What is your badge number?',
      validate: (input) => {
        // Emergency validation - any 4+ digit number
        return /^\d{4,}$/.test(input.trim());
      },
      ttl: emergencyDuration // Challenge expires with emergency window
    });
    
    console.log(`   Emergency Challenge: "${emergencyChallenge.prompt}"`);
    
    // Test emergency access
    ['1234', '12345', 'E001', 'abc'].forEach(badge => {
      try {
        const result = emergencyDevice.verifyAnswer(badge);
        console.log(`     Badge "${badge}": ${result ? '✅ VALID' : '❌ INVALID'}`);
      } catch (error) {
        console.log(`     Badge "${badge}": ❌ ERROR - ${error.message}`);
      }
    });
  }

  // Wait a bit and check expiration
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log(`   After 2 seconds: ${emergencyDevice.isDeviceAvailable() ? '🟢 STILL ACTIVE' : '🔴 EXPIRED'}`);
}

async function runDemo() {
  try {
    await demonstrateTimeBasedAvailability();
    await demonstrateScheduleBasedAvailability();
    await demonstrateCustomAvailability();
    await demonstrateConditionalChallenges();
    await demonstrateAdvancedAvailability();
    
    console.log('\n🎉 Availability controls demo completed!');
    console.log('\n💡 Key Takeaways:');
    console.log('   ✅ Time-based availability controls device discoverability');
    console.log('   ✅ Flexible scheduling with custom logic');
    console.log('   ✅ Multi-factor conditions can be combined');
    console.log('   ✅ Challenge types can adapt to availability context');
    console.log('   ✅ Emergency and backup scenarios are supported');
    
    console.log('\n📚 Next steps:');
    console.log('   - Run all tests: npm test');
    console.log('   - Check out the documentation: docs/protocol.md');
    console.log('   - Try the interactive demo: examples/interactive-riddles.js');
    console.log('   - Explore platform integrations: platform/ folder');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

runDemo();