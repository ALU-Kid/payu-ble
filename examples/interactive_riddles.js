#!/usr/bin/env node

const readline = require('readline');
const { PayuBLE } = require('../dist/index');

function askQuestion(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(prompt, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function createInteractiveSession() {
  const device = new PayuBLE('INTERACTIVE_RIDDLE_001');
  device.setBLEAvailability(() => true);

  const challenge = device.createChallenge({
    type: 'custom',
    formula: () => 'I speak without a mouth and hear without ears. What am I?',
    validAnswers: ['echo'],
    caseInsensitive: true
  });

  console.log(`🧠 Riddle Challenge: ${challenge.prompt}`);

  while (true) {
    const input = await askQuestion('Your answer: ');
    try {
      const result = device.verifyAnswer(input);
      if (result) {
        console.log('✅ Correct!');
        break;
      } else {
        console.log('❌ Incorrect. Try again.');
      }
    } catch (error) {
      console.log(`⚠️ Error: ${error.message}`);
    }
  }
}

createInteractiveSession().catch(error => {
  console.error('❌ Interactive session failed:', error.message);
  process.exit(1);
});
