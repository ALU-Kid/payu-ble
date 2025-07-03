#!/usr/bin/env node

const { PayuBLE } = require('../dist/index');
const readline = require('readline');

console.log('🧩 PayuBLE Riddles & Custom Challenges Demo\n');

// Create a device for riddles
const riddleDevice = new PayuBLE('RIDDLE_MASTER_001');

// Collection of riddles with multiple valid answers
const riddleBank = [
  {
    question: "What has keys but can't open locks?",
    answers: ['piano', 'a piano', 'keyboard', 'computer keyboard'],
    hint: "🎹 Think about musical instruments or computer peripherals"
  },
  {
    question: "What gets wet while drying?",
    answers: ['towel', 'a towel'],
    hint: "🛁 Something you use after a shower"
  },
  {
    question: "What has one eye but can't see?",
    answers: ['needle', 'a needle'],
    hint: "🧵 Used for sewing"
  },
  {
    question: "I'm tall when I'm young, and short when I'm old. What am I?",
    answers: ['candle', 'a candle'],
    hint: "🕯️ Something that burns"
  },
  {
    question: "What has hands but can't clap?",
    answers: ['clock', 'a clock', 'watch', 'a watch'],
    hint: "⏰ Tells time"
  },
  {
    question: "What comes down but never goes up?",
    answers: ['rain', 'the rain'],
    hint: "🌧️ Something from the sky"
  },
  {
    question: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?",
    answers: ['map', 'a map'],
    hint: "🗺️ Used for navigation"
  },
  {
    question: "What can travel around the world while staying in a corner?",
    answers: ['stamp', 'a stamp', 'postage stamp'],
    hint: "📮 Found on mail"
  }
];

async function createInteractiveSession() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  function askQuestion(question) {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  }

  console.log('🎮 Interactive Riddle Challenge Session');
  console.log('======================================');
  console.log('Type "hint" for a clue, "skip" to try another riddle, or "quit" to exit\n');

  let score = 0;
  let totalAttempts = 0;
  let hintsUsed = 0;
  const startTime = Date.now();

  for (let i = 0; i < riddleBank.length; i++) {
    const riddle = riddleBank[i];
    console.log(`\n--- Riddle ${i + 1}/${riddleBank.length} ---`);
    
    // Create the challenge
    const challenge = riddleDevice.createChallenge({
      type: 'custom',
      formula: () => riddle.question,
      validAnswers: riddle.answers,
      caseInsensitive: true
    });

    console.log(`🧩 ${challenge.prompt}`);
    
    let attempts = 0;
    let solved = false;
    const maxAttempts = 3;

    while (attempts < maxAttempts && !solved) {
      attempts++;
      totalAttempts++;
      
      const answer = await askQuestion(`\n💭 Your answer (attempt ${attempts}/${maxAttempts}): `);
      
      if (answer.toLowerCase() === 'quit') {
        console.log('\n👋 Thanks for playing! Goodbye!');
        rl.close();
        return { score, totalAttempts, hintsUsed, timeElapsed: Date.now() - startTime };
      }
      
      if (answer.toLowerCase() === 'skip') {
        console.log('⏭️  Skipping to next riddle...');
        break;
      }
      
      if (answer.toLowerCase() === 'hint') {
        console.log(`💡 Hint: ${riddle.hint}`);
        hintsUsed++;
        attempts--; // Don't count hint requests as attempts
        totalAttempts--;
        continue;
      }

      try {
        const isCorrect = riddleDevice.verifyAnswer(answer);
        
        if (isCorrect) {
          console.log('🎉 Correct! Well done!');
          score++;
          solved = true;
          
          // Show all valid answers
          if (riddle.answers.length > 1) {
            console.log(`📝 Other valid answers: ${riddle.answers.filter(a => a.toLowerCase() !== answer.toLowerCase()).join(', ')}`);
          }
        } else {
          console.log(`❌ Incorrect. ${maxAttempts - attempts} attempts remaining.`);
          if (attempts < maxAttempts) {
            console.log(`💡 Try again, or type "hint" for a clue, "skip" to move on`);
          }
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }

    if (!solved && attempts >= maxAttempts) {
      console.log(`\n😔 Out of attempts! The answer was: ${riddle.answers[0]}`);
      if (riddle.answers.length > 1) {
        console.log(`📝 All valid answers: ${riddle.answers.join(', ')}`);
      }
    }

    riddleDevice.clearChallenge();
    
    // Show progress
    console.log(`📊 Progress: ${score}/${i + 1} solved`);
  }

  const timeElapsed = Date.now() - startTime;
  const minutes = Math.floor(timeElapsed / 60000);
  const seconds = Math.floor((timeElapsed % 60000) / 1000);

  console.log(`\n🏆 Final Score: ${score}/${riddleBank.length}`);
  console.log(`📊 Total attempts: ${totalAttempts}`);
  console.log(`💡 Hints used: ${hintsUsed}`);
  console.log(`⏱️  Time elapsed: ${minutes}m ${seconds}s`);
  
  // Performance feedback
  if (score === riddleBank.length) {
    console.log('🎊 Perfect score! You\'re a riddle master!');
  } else if (score >= riddleBank.length * 0.8) {
    console.log('👏 Excellent! You solved most of the riddles!');
  } else if (score >= riddleBank.length * 0.6) {
    console.log('👍 Good job! You\'re getting the hang of it!');
  } else if (score >= riddleBank.length * 0.4) {
    console.log('🤔 Not bad! Keep practicing - riddles can be tricky!');
  } else {
    console.log('💪 Keep trying! Riddles take practice to master.');
  }

  // Efficiency rating
  const efficiency = totalAttempts > 0 ? (score / totalAttempts * 100).toFixed(1) : 0;
  console.log(`🎯 Efficiency: ${efficiency}% (correct answers per attempt)`);

  rl.close();
  return { score, totalAttempts, hintsUsed, timeElapsed, efficiency };
}

async function demonstrateCustomValidation() {
  console.log('\n🔧 Custom Validation Examples\n');

  // Password-style challenge
  console.log('--- Example 1: Password Validation ---');
  const passwordChallenge = riddleDevice.createChallenge({
    type: 'custom',
    formula: () => 'Enter a password with at least 8 characters, 1 number, and 1 uppercase letter:',
    validate: (input) => {
      return input.length >= 8 && 
             /\d/.test(input) && 
             /[A-Z]/.test(input);
    }
  });

  console.log(passwordChallenge.prompt);
  
  const testPasswords = ['weak', 'StrongPass1', 'noNumbers', 'nonumber1', 'NONUMBER1', 'ValidPass123'];
  testPasswords.forEach(pwd => {
    try {
      const result = riddleDevice.verifyAnswer(pwd);
      console.log(`📝 "${pwd}": ${result ? '✅ VALID' : '❌ INVALID'}`);
    } catch (error) {
      console.log(`📝 "${pwd}": ❌ ERROR - ${error.message}`);
    }
  });

  riddleDevice.clearChallenge();

  // Year validation
  console.log('\n--- Example 2: Current Year Validation ---');
  const yearChallenge = riddleDevice.createChallenge({
    type: 'custom',
    formula: () => 'What year is it?',
    validate: (input) => {
      const inputYear = parseInt(input);
      const currentYear = new Date().getFullYear();
      return inputYear === currentYear;
    }
  });

  console.log(yearChallenge.prompt);
  
  const currentYear = new Date().getFullYear();
  const testYears = [currentYear.toString(), '2020', '2030', 'abc', (currentYear - 1).toString()];
  testYears.forEach(year => {
    try {
      const result = riddleDevice.verifyAnswer(year);
      console.log(`📅 "${year}": ${result ? '✅ CORRECT' : '❌ INCORRECT'}`);
    } catch (error) {
      console.log(`📅 "${year}": ❌ ERROR - ${error.message}`);
    }
  });

  riddleDevice.clearChallenge();

  // Multi-step validation challenge
  console.log('\n--- Example 3: Multi-Step Validation ---');
  const multiStepChallenge = riddleDevice.createChallenge({
    type: 'custom',
    formula: () => 'Enter your info: NAME-AGE-DEPARTMENT (e.g., John-25-Engineering)',
    validate: (input) => {
      const parts = input.split('-');
      if (parts.length !== 3) return false;
      
      const [name, ageStr, dept] = parts.map(p => p.trim());
      
      // Name validation (2+ characters, letters only)
      const nameValid = name.length >= 2 && /^[a-zA-Z]+$/.test(name);
      
      // Age validation (18-99)
      const age = parseInt(ageStr);
      const ageValid = !isNaN(age) && age >= 18 && age <= 99;
      
      // Department validation
      const validDepts = ['Engineering', 'HR', 'Sales', 'Marketing', 'Finance'];
      const deptValid = validDepts.some(d => d.toLowerCase() === dept.toLowerCase());
      
      return nameValid && ageValid && deptValid;
    }
  });

  console.log(multiStepChallenge.prompt);
  console.log('Valid departments: Engineering, HR, Sales, Marketing, Finance');
  
  const testInputs = [
    'John-25-Engineering',
    'Alice-30-HR',
    'Bob-17-Sales',  // Too young
    'X-25-Engineering',  // Name too short
    'John-25-IT',  // Invalid department
    'John-abc-Engineering',  // Invalid age
    'John-25',  // Missing department
    'Jane-45-marketing'  // Case insensitive dept
  ];
  
  testInputs.forEach(input => {
    try {
      const result = riddleDevice.verifyAnswer(input);
      console.log(`👤 "${input}": ${result ? '✅ VALID' : '❌ INVALID'}`);
    } catch (error) {
      console.log(`👤 "${input}": ❌ ERROR - ${error.message}`);
    }
  });

  riddleDevice.clearChallenge();

  // Math equation validation
  console.log('\n--- Example 4: Dynamic Math Challenge ---');
  const a = Math.floor(Math.random() * 20) + 1;
  const b = Math.floor(Math.random() * 20) + 1;
  const operation = ['+', '-', '*'][Math.floor(Math.random() * 3)];
  
  let expectedAnswer;
  switch (operation) {
    case '+': expectedAnswer = a + b; break;
    case '-': expectedAnswer = a - b; break;
    case '*': expectedAnswer = a * b; break;
  }

  const mathChallenge = riddleDevice.createChallenge({
    type: 'custom',
    formula: () => `What is ${a} ${operation} ${b}?`,
    validate: (input) => {
      const userAnswer = parseInt(input.trim());
      return !isNaN(userAnswer) && userAnswer === expectedAnswer;
    }
  });

  console.log(mathChallenge.prompt);
  console.log(`Expected answer: ${expectedAnswer} (for demo purposes)`);
  
  const testMathAnswers = [
    expectedAnswer.toString(),
    (expectedAnswer + 1).toString(),
    (expectedAnswer - 1).toString(),
    'wrong',
    expectedAnswer.toString() + '.0'
  ];
  
  testMathAnswers.forEach(answer => {
    try {
      const result = riddleDevice.verifyAnswer(answer);
      console.log(`🔢 "${answer}": ${result ? '✅ CORRECT' : '❌ INCORRECT'}`);
    } catch (error) {
      console.log(`🔢 "${answer}": ❌ ERROR - ${error.message}`);
    }
  });

  riddleDevice.clearChallenge();
}

async function demonstrateAdvancedFeatures() {
  console.log('\n🚀 Advanced Features Demo\n');

  // Challenge with TTL
  console.log('--- Time-Limited Challenge ---');
  const timedChallenge = riddleDevice.createChallenge({
    type: 'custom',
    formula: () => 'Quick! What color is the sky? (You have 2 seconds)',
    validAnswers: ['blue', 'light blue', 'sky blue'],
    caseInsensitive: true,
    ttl: 2000 // 2 seconds
  });

  console.log(timedChallenge.prompt);
  console.log(`⏰ Challenge expires at: ${new Date(timedChallenge.expiresAt).toLocaleTimeString()}`);

  // Test immediate answer
  try {
    const result = riddleDevice.verifyAnswer('blue');
    console.log(`🏃‍♂️ Immediate answer "blue": ${result ? '✅ CORRECT' : '❌ INCORRECT'}`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Wait for expiration and test
  await new Promise(resolve => setTimeout(resolve, 2100));
  
  try {
    const result = riddleDevice.verifyAnswer('blue');
    console.log(`⏰ After expiration "blue": ${result ? '✅ CORRECT' : '❌ INCORRECT'}`);
  } catch (error) {
    console.log(`❌ ${error.message}`);
  }

  riddleDevice.clearChallenge();

  // Case sensitivity demonstration
  console.log('\n--- Case Sensitivity Demo ---');
  
  // Case sensitive
  const sensitiveChallenge = riddleDevice.createChallenge({
    type: 'custom',
    formula: () => 'Enter exactly: "CaseSensitive"',
    validAnswers: ['CaseSensitive'],
    caseInsensitive: false
  });

  console.log('🔤 Case Sensitive Challenge:');
  console.log(sensitiveChallenge.prompt);
  
  ['CaseSensitive', 'casesensitive', 'CASESENSITIVE', 'Casesensitive'].forEach(answer => {
    try {
      const result = riddleDevice.verifyAnswer(answer);
      console.log(`   "${answer}": ${result ? '✅ CORRECT' : '❌ INCORRECT'}`);
    } catch (error) {
      console.log(`   "${answer}": ❌ ERROR`);
    }
  });

  riddleDevice.clearChallenge();

  // Context-aware challenges
  console.log('\n--- Context-Aware Challenge ---');
  const currentHour = new Date().getHours();
  let timeContext;
  
  if (currentHour >= 5 && currentHour < 12) {
    timeContext = 'morning';
  } else if (currentHour >= 12 && currentHour < 17) {
    timeContext = 'afternoon';
  } else if (currentHour >= 17 && currentHour < 21) {
    timeContext = 'evening';
  } else {
    timeContext = 'night';
  }

  const contextChallenge = riddleDevice.createChallenge({
    type: 'custom',
    formula: () => `Good ${timeContext}! What time of day is it now?`,
    validAnswers: [timeContext, `${timeContext} time`],
    caseInsensitive: true
  });

  console.log(`🌅 Context-Aware Challenge (Current time: ${new Date().toLocaleTimeString()}):`);
  console.log(contextChallenge.prompt);
  
  [timeContext, 'morning', 'afternoon', 'evening', 'night'].forEach(answer => {
    try {
      const result = riddleDevice.verifyAnswer(answer);
      console.log(`   "${answer}": ${result ? '✅ CORRECT' : '❌ INCORRECT'}`);
    } catch (error) {
      console.log(`   "${answer}": ❌ ERROR`);
    }
  });

  riddleDevice.clearChallenge();
}

async function runDemo() {
  try {
    console.log(`Device ID: ${riddleDevice.getDeviceId()}\n`);
    
    console.log('Choose a demo mode:');
    console.log('1. Interactive riddle session (requires user input)');
    console.log('2. Automated validation examples');
    console.log('3. Advanced features demo');
    console.log('4. All automated demos (2 & 3)');
    
    // Check if we're in an interactive environment
    const isInteractive = process.stdin.isTTY;
    
    if (isInteractive) {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const choice = await new Promise((resolve) => {
        rl.question('\nSelect option (1-4): ', resolve);
      });

      rl.close();

      switch (choice.trim()) {
        case '1':
          console.log('\n🎮 Starting Interactive Riddle Session...\n');
          await createInteractiveSession();
          break;
        case '2':
          console.log('\n🤖 Running Custom Validation Examples...\n');
          await demonstrateCustomValidation();
          break;
        case '3':
          console.log('\n🚀 Running Advanced Features Demo...\n');
          await demonstrateAdvancedFeatures();
          break;
        case '4':
        default:
          console.log('\n🤖 Running All Automated Demos...\n');
          await demonstrateCustomValidation();
          await demonstrateAdvancedFeatures();
          break;
      }
    } else {
      console.log('\n🤖 Non-interactive environment detected. Running automated demos...\n');
      await demonstrateCustomValidation();
      await demonstrateAdvancedFeatures();
    }
    
    console.log('\n🎉 Riddles demo completed!');
    console.log('\n💡 Demo Features Shown:');
    console.log('   ✅ Multiple valid answers for riddles');
    console.log('   ✅ Case-sensitive and case-insensitive matching');
    console.log('   ✅ Custom validation functions');
    console.log('   ✅ Multi-step validation logic');
    console.log('   ✅ Time-based challenges with TTL');
    console.log('   ✅ Context-aware challenge generation');
    console.log('   ✅ Interactive user input handling');
    
    console.log('\n📚 Next steps:');
    console.log('   - Try availability controls: npm run demo:availability');
    console.log('   - Explore math challenges: npm run demo:math');
    console.log('   - Run the test suite: npm test');
    console.log('   - Check out browser demo: npm run demo:browser');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Export the interactive session for separate use
module.exports = { createInteractiveSession, demonstrateCustomValidation, demonstrateAdvancedFeatures };

// Run demo if called directly
if (require.main === module) {
  runDemo();
} ERROR`);
    }
  });

  riddleDevice.clearChallenge();

  // Case insensitive
  const insensitiveChallenge = riddleDevice.createChallenge({
    type: 'custom',
    formula: () => 'Enter: "flexible" (any case)',
    validAnswers: ['flexible'],
    caseInsensitive: true
  });

  console.log('\n🔤 Case Insensitive Challenge:');
  console.log(insensitiveChallenge.prompt);
  
  ['flexible', 'FLEXIBLE', 'Flexible', 'FlExIbLe'].forEach(answer => {
    try {
      const result = riddleDevice.verifyAnswer(answer);
      console.log(`   "${answer}": ${result ? '✅ CORRECT' : '❌ INCORRECT'}`);
    } catch (error) {
      console.log(`   "${answer}": ❌#!/usr/bin/env node

const { PayuBLE } = require('../dist/index');
const readline = require('readline');

console.log('🧩 PayuBLE Riddles & Custom Challenges Demo\n');

// Create a device for riddles
const riddleDevice = new PayuBLE('RIDDLE_MASTER_001');

// Collection of riddles with multiple valid answers
const riddleBank = [
  {
    question: "What has keys but can't open locks?",
    answers: ['piano', 'a piano', 'keyboard', 'computer keyboard'],
    hint: "🎹 Think about musical instruments or computer peripherals"
  },
  {
    question: "What gets wet while drying?",
    answers: ['towel', 'a towel'],
    hint: "🛁 Something you use after a shower"
  },
  {
    question: "What has one eye but can't see?",
    answers: ['needle', 'a needle'],
    hint: "🧵 Used for sewing"
  },
  {
    question: "I'm tall when I'm young, and short when I'm old. What am I?",
    answers: ['candle', 'a candle'],
    hint: "🕯️ Something that burns"
  },
  {
    question: "What has hands but can't clap?",
    answers: ['clock', 'a clock', 'watch', 'a watch'],
    hint: "⏰ Tells time"
  },
  {
    question: "What comes down but never goes up?",
    answers: ['rain', 'the rain'],
    hint: "🌧️ Something from the sky"
  }
];

async function createInteractiveSession() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  function askQuestion(question) {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  }

  console.log('🎮 Interactive Riddle Challenge Session');
  console.log('Type "hint" for a clue, "skip" to try another riddle, or "quit" to exit\n');

  let score = 0;
  let totalAttempts = 0;

  for (let i = 0; i < riddleBank.length; i++) {
    const riddle = riddleBank[i];
    console.log(`\n--- Riddle ${i + 1}/${riddleBank.length} ---`);
    
    // Create the challenge
    const challenge = riddleDevice.createChallenge({
      type: 'custom',
      formula: () => riddle.question,
      validAnswers: riddle.answers,
      caseInsensitive: true
    });

    console.log(`🧩 ${challenge.prompt}`);
    
    let attempts = 0;
    let solved = false;
    const maxAttempts = 3;

    while (attempts < maxAttempts && !solved) {
      attempts++;
      totalAttempts++;
      
      const answer = await askQuestion(`\n💭 Your answer (attempt ${attempts}/${maxAttempts}): `);
      
      if (answer.toLowerCase() === 'quit') {
        console.log('\n👋 Thanks for playing! Goodbye!');
        rl.close();
        return;
      }
      
      if (answer.toLowerCase() === 'skip') {
        console.log('⏭️  Skipping to next riddle...');
        break;
      }
      
      if (answer.toLowerCase() === 'hint') {
        console.log(`💡 Hint: ${riddle.hint}`);
        attempts--; // Don't count hint requests as attempts
        totalAttempts--;
        continue;
      }

      try {
        const isCorrect = riddleDevice.verifyAnswer(answer);
        
        if (isCorrect) {
          console.log('🎉 Correct! Well done!');
          score++;
          solved = true;
        } else {
          console.log(`❌ Incorrect. ${maxAttempts - attempts} attempts remaining.`);
          if (attempts < maxAttempts) {
            console.log(`💡 Try again, or type "hint" for a clue`);
          }
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }

    if (!solved && attempts >= maxAttempts) {
      console.log(`\n😔 Out of attempts! The answer was: ${riddle.answers[0]}`);
    }

    riddleDevice.clearChallenge();
  }

  console.log(`\n🏆 Final Score: ${score}/${riddleBank.length}`);
  console.log(`📊 Total attempts: ${totalAttempts}`);
  
  if (score === riddleBank.length) {
    console.log('🎊 Perfect score! You\'re a riddle master!');
  } else if (score >= riddleBank.length * 0.7) {
    console.log('👏 Great job! You solved most of the riddles!');
  } else {
    console.log('🤔 Keep practicing - riddles can be tricky!');
  }

  rl.close();
}

async function demonstrateCustomValidation() {
  console.log('\n🔧 Custom Validation Examples\n');

  // Password-style challenge
  console.log('--- Example 1: Password Validation ---');
  const passwordChallenge = riddleDevice.createChallenge({
    type: 'custom',
    formula: () => 'Enter a password with at least 8 characters, 1 number, and 1 uppercase letter:',
    validate: (input) => {
      return input.length >= 8 && 
             /\d/.test(input) && 
             /[A-Z]/.test(input);
    }
  });

  console.log(passwordChallenge.prompt);
  
  const testPasswords = ['weak', 'StrongPass1', 'noNumbers', 'nonumber1', 'NONUMBER1'];
  testPasswords.forEach(pwd => {
    try {
      const result = riddleDevice.verifyAnswer(pwd);
      console.log(`📝 "${pwd}": ${result ? '✅ VALID' : '❌ INVALID'}`);
    } catch (error) {
      console.log(`📝 "${pwd}": ❌ ERROR - ${error.message}`);
    }
  });

  riddleDevice.clearChallenge();

  // Year validation
  console.log('\n--- Example 2: Current Year Validation ---');
  const yearChallenge = riddleDevice.createChallenge({
    type: 'custom',
    formula: () => 'What year is it?',
    validate: (input) => {
      const inputYear = parseInt(input);
      const currentYear = new Date().getFullYear();
      return inputYear === currentYear;
    }
  });

  console.log(yearChallenge.prompt);
  
  const currentYear = new Date().getFullYear();
  const testYears = [currentYear.toString(), '2020', '2030', 'abc'];
  testYears.forEach(year => {
    try {
      const result = riddleDevice.verifyAnswer(year);
      console.log(`📅 "${year}": ${result ? '✅ CORRECT' : '❌ INCORRECT'}`);
    } catch (error) {
      console.log(`📅 "${year}": ❌ ERROR - ${error.message}`);
    }
  });

  riddleDevice.clearChallenge();

  // Math equation validation
  console.log('\n--- Example 3: Dynamic Math Challenge ---');
  const mathChallenge = riddleDevice.createChallenge({
    type: 'custom',
    formula: () => {
      const a = Math.floor(Math.random() * 20) + 1;
      const b = Math.floor(Math.random() * 20) + 1;
      // Store the values for validation (in real app, you'd handle this differently)
      mathChallenge._a = a;
      mathChallenge._b = b;
      return `What is ${a} × ${b}?`;
    },
    validate: (input) => {
      const expected = mathChallenge._a * mathChallenge._b;
      return parseInt(input) === expected;
    }
  });

  console.log(mathChallenge.prompt);
  
  // Calculate the correct answer for demonstration
  const correctAnswer = mathChallenge._a * mathChallenge._b;
  const testAnswers = [correctAnswer.toString(), '999', (correctAnswer + 1).toString()];
  
  testAnswers.forEach(answer => {
    try {
      const result = riddleDevice.verifyAnswer(answer);
      console.log(`🔢 "${answer}": ${result ? '✅ CORRECT' : '❌ INCORRECT'}`);
    } catch (error) {
      console.log(`🔢 "${answer}": ❌ ERROR - ${error.message}`);
    }
  });

  riddleDevice.clearChallenge();
}

async function demonstrateAdvancedFeatures() {
  console.log('\n🚀 Advanced Features Demo\n');

  // Challenge with TTL
  console.log('--- Time-Limited Challenge ---');
  const timedChallenge = riddleDevice.createChallenge({
    type: 'custom',
    formula: () => 'Quick! What color is the sky? (You have 2 seconds)',
    validAnswers: ['blue', 'light blue', 'sky blue'],
    caseInsensitive: true,
    ttl: 2000 // 2 seconds
  });

  console.log(timedChallenge.prompt);
  console.log(`⏰ Challenge expires at: ${new Date(timedChallenge.expiresAt).toLocaleTimeString()}`);

  // Test immediate answer
  try {
    const result = riddleDevice.verifyAnswer('blue');
    console.log(`🏃‍♂️ Immediate answer "blue": ${result ? '✅ CORRECT' : '❌ INCORRECT'}`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Wait for expiration and test
  await new Promise(resolve => setTimeout(resolve, 2100));
  
  try {
    const result = riddleDevice.verifyAnswer('blue');
    console.log(`⏰ After expiration "blue": ${result ? '✅ CORRECT' : '❌ INCORRECT'}`);
  } catch (error) {
    console.log(`❌ ${error.message}`);
  }

  riddleDevice.clearChallenge();

  // Case sensitivity demonstration
  console.log('\n--- Case Sensitivity Demo ---');
  
  // Case sensitive
  const sensitiveChallenge = riddleDevice.createChallenge({
    type: 'custom',
    formula: () => 'Enter exactly: "CaseSensitive"',
    validAnswers: ['CaseSensitive'],
    caseInsensitive: false
  });

  console.log('🔤 Case Sensitive Challenge:');
  console.log(sensitiveChallenge.prompt);
  
  ['CaseSensitive', 'casesensitive', 'CASESENSITIVE'].forEach(answer => {
    try {
      const result = riddleDevice.verifyAnswer(answer);
      console.log(`   "${answer}": ${result ? '✅ CORRECT' : '❌ INCORRECT'}`);
    } catch (error) {
      console.log(`   "${answer}": ❌ ERROR`);
    }
  });

  riddleDevice.clearChallenge();

  // Case insensitive
  const insensitiveChallenge = riddleDevice.createChallenge({
    type: 'custom',
    formula: () => 'Enter: "flexible" (any case)',
    validAnswers: ['flexible'],
    caseInsensitive: true
  });

  console.log('\n🔤 Case Insensitive Challenge:');
  console.log(insensitiveChallenge.prompt);
  
  ['flexible', 'FLEXIBLE', 'Flexible', 'FlExIbLe'].forEach(answer => {
    try {
      const result = riddleDevice.verifyAnswer(answer);
      console.log(`   "${answer}": ${result ? '✅ CORRECT' : '❌ INCORRECT'}`);
    } catch (error) {
      console.log(`   "${answer}": ❌ ERROR`);
    }
  });

  riddleDevice.clearChallenge();
}

async function runDemo() {
  try {
    console.log(`Device ID: ${riddleDevice.getDeviceId()}\n`);
    
    console.log('Choose a demo mode:');
    console.log('1. Interactive riddle session (requires user input)');
    console.log('2. Automated validation examples');
    console.log('3. Advanced features demo');
    
    // For automated demo, we'll run examples 2 and 3
    console.log('\n🤖 Running automated demos (2 & 3)...\n');
    
    await demonstrateCustomValidation();
    await demonstrateAdvancedFeatures();
    
    console.log('\n🎉 Riddles demo completed!');
    console.log('\n💡 To try the interactive riddle session, run:');
    console.log('   node examples/interactive-riddles.js');
    console.log('\n📚 Next steps:');
    console.log('   - Try availability controls: node examples/availability-demo.js');
    console.log('   - Run the test suite: npm test');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Export the interactive session for separate use
module.exports = { createInteractiveSession };

// Run demo if called directly
if (require.main === module) {
  runDemo();
}