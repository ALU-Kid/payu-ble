/**
 * Test suite for CJS/ESM compatibility
 */

import { spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(spawn);

describe('CJS/ESM Compatibility', () => {
  test('should work with CommonJS imports', async () => {
    const testScript = `
      const { PayuBLE, createChallenge, helpers } = require('./dist/index.cjs');
      
      // Test basic functionality
      const payu = new PayuBLE('test-device-cjs');
      const deviceId = payu.getDeviceId();
      const challenge = payu.createChallenge({ type: 'arithmetic', difficulty: 1 });
      
      console.log('CJS_TEST_PASSED');
      process.exit(0);
    `;
    
    const result = await new Promise<string>((resolve, reject) => {
      const child = spawn('node', ['-e', testScript], { 
        cwd: path.resolve(__dirname, '..'),
        stdio: 'pipe'
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Process exited with code ${code}. stderr: ${stderr}`));
        }
      });
    });
    
    expect(result).toContain('CJS_TEST_PASSED');
  });

  test('should work with ESM imports', async () => {
    const testScript = `
      import { PayuBLE, createChallenge, helpers } from './dist/index.mjs';
      
      // Test basic functionality
      const payu = new PayuBLE('test-device-esm');
      const deviceId = payu.getDeviceId();
      const challenge = payu.createChallenge({ type: 'arithmetic', difficulty: 1 });
      
      console.log('ESM_TEST_PASSED');
      process.exit(0);
    `;
    
    const result = await new Promise<string>((resolve, reject) => {
      const child = spawn('node', ['--input-type=module', '-e', testScript], { 
        cwd: path.resolve(__dirname, '..'),
        stdio: 'pipe'
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Process exited with code ${code}. stderr: ${stderr}`));
        }
      });
    });
    
    expect(result).toContain('ESM_TEST_PASSED');
  });

  test('should work with CommonJS platform imports', async () => {
    const testScript = `
      const { 
        getPlatformInfo, 
        createPlatformHelpers, 
        GPIOButtonHelper 
      } = require('./platform/dist/platform_index.cjs');
      
      // Test platform functionality
      const platformInfo = getPlatformInfo();
      const helpers = createPlatformHelpers();
      
      console.log('CJS_PLATFORM_TEST_PASSED');
      process.exit(0);
    `;
    
    const result = await new Promise<string>((resolve, reject) => {
      const child = spawn('node', ['-e', testScript], { 
        cwd: path.resolve(__dirname, '..'),
        stdio: 'pipe'
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Process exited with code ${code}. stderr: ${stderr}`));
        }
      });
    });
    
    expect(result).toContain('CJS_PLATFORM_TEST_PASSED');
  });

  test('should work with ESM platform imports', async () => {
    const testScript = `
      import { 
        getPlatformInfo, 
        createPlatformHelpers, 
        GPIOButtonHelper 
      } from './platform/dist/platform_index.mjs';
      
      // Test platform functionality
      const platformInfo = getPlatformInfo();
      const helpers = createPlatformHelpers();
      
      console.log('ESM_PLATFORM_TEST_PASSED');
      process.exit(0);
    `;
    
    const result = await new Promise<string>((resolve, reject) => {
      const child = spawn('node', ['--input-type=module', '-e', testScript], { 
        cwd: path.resolve(__dirname, '..'),
        stdio: 'pipe'
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Process exited with code ${code}. stderr: ${stderr}`));
        }
      });
    });
    
    expect(result).toContain('ESM_PLATFORM_TEST_PASSED');
  });
});