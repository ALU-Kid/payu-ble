#!/usr/bin/env node

const { createChallenge, verifyAnswer, PayuBLE } = require('../dist/index');

console.log('🔐 PayuBLE Math Challenges Demo\n');

// Create a device instance
const device = new PayuBLE('MATH_DEMO_001');
console.log(`Device ID: ${device.getDeviceId()}\n`);

async function demonstrateMathChallenges() {
  const difficulties = [
    { level: 1, name: 'Easy' },
    { level: 2, name: 'Medium' },
    { level: 3, name: 'Hard' },
    { level: 4, name: 'Expert' }
  ];

  for (const difficulty of difficulties) {
    console.log(`\n--- ${difficulty.name} Math Challenge (Level ${difficulty.level}) ---`);
    
    const challenge = device.createChallenge({
      type: 'arithmetic',
      difficulty: difficulty.level
    });

    console.log(`Challenge: ${challenge.prompt}`);
    console.log(`Challenge ID: ${challenge.id}`);
    console.log(`Created at: ${new Date(challenge.createdAt).toLocaleTimeString()}`);

    // Simulate some wrong answers
    const wrongAnswers = ['0', '999', 'abc'];
    for (const wrong of wrongAnswers) {
      try {
        const result = device.verifyAnswer(wrong);
        console.log(`❌ Answer "${wrong}": ${result ? 'CORRECT' : 'INCORRECT'}`);
      } catch (error) {
        console.log(`❌ Answer "${wrong}": ERROR - ${error.message}`);
      }
    }

    // For demonstration, let's try to solve it programmatically
    // Note: In real use, this would come from user input
    try {
      console.log(`\n🤔 Attempting to solve programmatically...`);
      
      // Extract numbers and operators from the prompt for simple cases
      const promptText = challenge.prompt.replace('Solve: ', '');
      let answer;
      
      try {
        // WARNING: eval() is dangerous and should NEVER be used in production!
        // This is only for demonstration purposes
        // Replace × with * for JavaScript evaluation
        const jsExpression = promptText.replace(/×/g, '*');
        answer = eval(jsExpression);
        
        console.log(`📝 Calculated answer: ${answer}`);
        
        const isCorrect = device.verifyAnswer(answer.toString());
        console.log(`✅ Verification result: ${isCorrect ? 'CORRECT!' : 'INCORRECT'}`);
        
      } catch (evalError) {
        console.log(`⚠️  Could not evaluate expression programmatically`);
        console.log(`   In real use, this would be answered by the user`);
      }
      
    } catch (error) {
      console.log(`❌ Error verifying answer: ${error.message}`);
    }

    // Clear the challenge for next iteration
    device.clearChallenge();
    
    // Add a small delay for readability
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function demonstrateTimedChallenge() {
  console.log('\n\n--- Timed Challenge Demo ---');
  
  const challenge = device.createChallenge({
    type: 'arithmetic',
    difficulty: 2,
    ttl: 3000 // 3 seconds
  });

  console.log(`Challenge: ${challenge.prompt}`);
  console.log(`⏰ This challenge will expire in 3 seconds...`);
  console.log(`Expires at: ${new Date(challenge.expiresAt).toLocaleTimeString()}`);

  // Wait 1 second, then try to answer
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log(`\n⏱️  After 1 second - trying to answer...`);
  
  try {
    const result = device.verifyAnswer('42'); // Wrong answer, but should still work
    console.log(`Answer result: ${result ? 'CORRECT' : 'INCORRECT'}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }

  // Wait for expiration
  await new Promise(resolve => setTimeout(resolve, 2500));
  console.log(`\n⏰ After expiration - trying to answer...`);
  
  try {
    const result = device.verifyAnswer('42');
    console.log(`Answer result: ${result ? 'CORRECT' : 'INCORRECT'}`);
  } catch (error) {
    console.log(`❌ ${error.message}`);
  }

  device.clearChallenge();
}

async function demonstrateHashChallenge() {
  console.log('\n\n--- Hash-Based Challenge Demo ---');
  
  const challenge = device.createChallenge({
    type: 'hash'
  });

  console.log(`Challenge: ${challenge.prompt}`);
  console.log(`Challenge ID: ${challenge.id}`);
  
  // For demonstration, let's solve the hash challenge
  const crypto = require('crypto');
  
  // Extract the input from the prompt
  const match = challenge.prompt.match(/SHA256\("(.+)"\)/);
  if (match) {
    const input = match[1];
    const hash = crypto.createHash('sha256').update(input).digest('hex');
    const correctAnswer = (parseInt(hash.substring(0, 8), 16) % 100).toString();
    
    console.log(`📊 Hash input: "${input}"`);
    console.log(`🔐 Full SHA256: ${hash}`);
    console.log(`🎯 Correct answer: ${correctAnswer}`);
    
    const isCorrect = device.verifyAnswer(correctAnswer);
    console.log(`✅ Verification: ${isCorrect ? 'CORRECT!' : 'INCORRECT'}`);
    
    // Try wrong answer
    const wrongAnswer = (parseInt(correctAnswer) + 1).toString();
    const isWrong = device.verifyAnswer(wrongAnswer);
    console.log(`❌ Wrong answer (${wrongAnswer}): ${isWrong ? 'CORRECT' : 'INCORRECT'}`);
  }

  device.clearChallenge();
}

// Run the demonstrations
async function runDemo() {
  try {
    await demonstrateMathChallenges();
    await demonstrateTimedChallenge();
    await demonstrateHashChallenge();
    
    console.log('\n🎉 Math challenges demo completed!');
    console.log('\n💡 Next steps:');
    console.log('   - Try the riddles demo: node examples/riddles-demo.js');
    console.log('   - Check availability triggers: node examples/availability-demo.js');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

runDemo();