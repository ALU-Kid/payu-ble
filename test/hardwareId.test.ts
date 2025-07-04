import { getHardwareDeviceId } from '../src/index';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(),
  unlinkSync: jest.fn()
}));

// Mock child_process
jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

// Mock os module
jest.mock('os', () => ({
  homedir: jest.fn(() => '/mock/home')
}));

const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;
const mockWriteFileSync = writeFileSync as jest.MockedFunction<typeof writeFileSync>;
const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
const mockHomedir = homedir as jest.MockedFunction<typeof homedir>;

describe('Hardware Device ID', () => {
  const originalPlatform = process.platform;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockHomedir.mockReturnValue('/mock/home');
  });

  afterEach(() => {
    // Restore original platform
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      writable: true
    });
  });

  describe('Linux Platform', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        writable: true
      });
    });

    it('should use /etc/machine-id when available', () => {
      const mockMachineId = 'abcdef1234567890abcdef1234567890';
      mockExistsSync.mockImplementation((path: string) => path === '/etc/machine-id');
      mockReadFileSync.mockImplementation((path: string) => {
        if (path === '/etc/machine-id') return mockMachineId;
        throw new Error('File not found');
      });

      const deviceId = getHardwareDeviceId();
      
      expect(mockExistsSync).toHaveBeenCalledWith('/etc/machine-id');
      expect(mockReadFileSync).toHaveBeenCalledWith('/etc/machine-id', 'utf8');
      expect(deviceId).toBeDefined();
      expect(deviceId).toHaveLength(16);
    });

    it('should fallback to /var/lib/dbus/machine-id when /etc/machine-id is not available', () => {
      const mockMachineId = 'fedcba0987654321fedcba0987654321';
      mockExistsSync.mockImplementation((path: string) => path === '/var/lib/dbus/machine-id');
      mockReadFileSync.mockImplementation((path: string) => {
        if (path === '/var/lib/dbus/machine-id') return mockMachineId;
        throw new Error('File not found');
      });

      const deviceId = getHardwareDeviceId();
      
      expect(mockExistsSync).toHaveBeenCalledWith('/etc/machine-id');
      expect(mockExistsSync).toHaveBeenCalledWith('/var/lib/dbus/machine-id');
      expect(mockReadFileSync).toHaveBeenCalledWith('/var/lib/dbus/machine-id', 'utf8');
      expect(deviceId).toBeDefined();
      expect(deviceId).toHaveLength(16);
    });

    it('should use CPU serial from /proc/cpuinfo on Raspberry Pi', () => {
      const mockCpuInfo = `processor\t: 0\nmodel name\t: ARMv7 Processor rev 3 (v7l)\nSerial\t\t: 00000000a1b2c3d4\n`;
      mockExistsSync.mockReturnValue(false);
      mockReadFileSync.mockImplementation((path: string) => {
        if (path === '/proc/cpuinfo') return mockCpuInfo;
        throw new Error('File not found');
      });

      const deviceId = getHardwareDeviceId();
      
      expect(mockReadFileSync).toHaveBeenCalledWith('/proc/cpuinfo', 'utf8');
      expect(deviceId).toBeDefined();
      expect(deviceId).toHaveLength(16);
    });

    it('should fallback to stored UUID when no hardware ID is available', () => {
      const mockStoredId = 'stored123456789a';
      mockExistsSync.mockImplementation((path: string) => path === '/mock/home/.payu-ble-id');
      mockReadFileSync.mockImplementation((path: string) => {
        if (path === '/mock/home/.payu-ble-id') return mockStoredId;
        throw new Error('File not found');
      });

      const deviceId = getHardwareDeviceId();
      
      expect(deviceId).toBe(mockStoredId);
    });
  });

  describe('macOS Platform', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true
      });
    });

    it('should use system_profiler to get hardware UUID', () => {
      const mockOutput = 'Hardware UUID: 12345678-1234-5678-9ABC-DEF012345678';
      mockExecSync.mockReturnValue(Buffer.from(mockOutput, 'utf8'));

      const deviceId = getHardwareDeviceId();
      
      expect(mockExecSync).toHaveBeenCalledWith(
        'system_profiler SPHardwareDataType | grep "Hardware UUID"',
        { encoding: 'utf8', timeout: 5000 }
      );
      expect(deviceId).toBeDefined();
      expect(deviceId).toHaveLength(16);
    });

    it('should fallback when system_profiler fails', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Command failed');
      });
      mockExistsSync.mockReturnValue(false);

      const deviceId = getHardwareDeviceId();
      
      expect(deviceId).toBeDefined();
      expect(deviceId).toHaveLength(16);
      expect(mockWriteFileSync).toHaveBeenCalledWith('/mock/home/.payu-ble-id', deviceId, 'utf8');
    });
  });

  describe('Windows Platform', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true
      });
    });

    it('should use wmic to get product UUID', () => {
      const mockOutput = 'UUID=12345678-1234-5678-9ABC-DEF012345678';
      mockExecSync.mockReturnValue(Buffer.from(mockOutput, 'utf8'));

      const deviceId = getHardwareDeviceId();
      
      expect(mockExecSync).toHaveBeenCalledWith(
        'wmic csproduct get uuid /value',
        { encoding: 'utf8', timeout: 5000 }
      );
      expect(deviceId).toBeDefined();
      expect(deviceId).toHaveLength(16);
    });

    it('should fallback when wmic fails', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Command failed');
      });
      mockExistsSync.mockReturnValue(false);

      const deviceId = getHardwareDeviceId();
      
      expect(deviceId).toBeDefined();
      expect(deviceId).toHaveLength(16);
      expect(mockWriteFileSync).toHaveBeenCalledWith('/mock/home/.payu-ble-id', deviceId, 'utf8');
    });
  });

  describe('Fallback UUID Generation', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', {
        value: 'unknown',
        writable: true
      });
    });

    it('should generate and store a new UUID when no stored ID exists', () => {
      mockExistsSync.mockReturnValue(false);

      const deviceId = getHardwareDeviceId();
      
      expect(deviceId).toBeDefined();
      expect(deviceId).toHaveLength(16);
      expect(mockWriteFileSync).toHaveBeenCalledWith('/mock/home/.payu-ble-id', deviceId, 'utf8');
    });

    it('should reuse stored UUID from file', () => {
      const mockStoredId = 'reused123456789ab';
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(mockStoredId);

      const deviceId = getHardwareDeviceId();
      
      expect(deviceId).toBe(mockStoredId);
      expect(mockWriteFileSync).not.toHaveBeenCalled();
    });

    it('should generate new UUID when stored file is empty', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('');

      const deviceId = getHardwareDeviceId();
      
      expect(deviceId).toBeDefined();
      expect(deviceId).toHaveLength(16);
      expect(mockWriteFileSync).toHaveBeenCalledWith('/mock/home/.payu-ble-id', deviceId, 'utf8');
    });

    it('should handle file write errors gracefully', () => {
      mockExistsSync.mockReturnValue(false);
      mockWriteFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const deviceId = getHardwareDeviceId();
      
      expect(deviceId).toBeDefined();
      expect(deviceId).toHaveLength(16);
    });
  });

  describe('Consistency', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', {
        value: 'unknown',
        writable: true
      });
    });
    
    it('should return the same ID on subsequent calls', () => {
      const mockStoredId = 'consistent123456a';
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(mockStoredId);

      const deviceId1 = getHardwareDeviceId();
      const deviceId2 = getHardwareDeviceId();
      
      expect(deviceId1).toBe(deviceId2);
      expect(mockReadFileSync).toHaveBeenCalledWith('/mock/home/.payu-ble-id', 'utf8');
    });

    it('should generate valid hex string format', () => {
      mockExistsSync.mockReturnValue(false);

      const deviceId = getHardwareDeviceId();
      
      expect(deviceId).toMatch(/^[a-f0-9]{16}$/);
    });
  });
});