import { createHash } from 'crypto';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export function getHardwareDeviceId(): string {
  try {
    // Try platform-specific hardware ID detection
    const hardwareId = detectHardwareId();
    if (hardwareId) {
      return hardwareId;
    }
  } catch (error) {
    // Fallback to stored UUID if hardware detection fails
  }

  // Use fallback UUID stored in user's home directory
  return getFallbackDeviceId();
}

function detectHardwareId(): string | null {
  const platform = process.platform;

  try {
    switch (platform) {
      case 'linux':
        return getLinuxMachineId();
      case 'darwin':
        return getMacOSHardwareId();
      case 'win32':
        return getWindowsHardwareId();
      default:
        return null;
    }
  } catch (error) {
    return null;
  }
}

function getLinuxMachineId(): string | null {
  const machineIdPaths = [
    '/etc/machine-id',
    '/var/lib/dbus/machine-id'
  ];

  for (const path of machineIdPaths) {
    try {
      if (existsSync(path)) {
        const id = readFileSync(path, 'utf8').trim();
        if (id && id.length > 0) {
          return createHash('sha256').update(id).digest('hex').substring(0, 16);
        }
      }
    } catch (error) {
      continue;
    }
  }

  // Try CPU info for Raspberry Pi
  try {
    const cpuInfo = readFileSync('/proc/cpuinfo', 'utf8');
    const serialMatch = cpuInfo.match(/Serial\s*:\s*([a-f0-9]+)/i);
    if (serialMatch && serialMatch[1]) {
      return createHash('sha256').update(serialMatch[1]).digest('hex').substring(0, 16);
    }
  } catch (error) {
    // Ignore and continue
  }

  return null;
}

function getMacOSHardwareId(): string | null {
  try {
    const output = execSync('system_profiler SPHardwareDataType | grep "Hardware UUID"', { 
      encoding: 'utf8',
      timeout: 5000
    });
    const match = output.match(/Hardware UUID:\s*([A-F0-9-]+)/i);
    if (match && match[1]) {
      return createHash('sha256').update(match[1]).digest('hex').substring(0, 16);
    }
  } catch (error) {
    // Ignore and continue
  }
  return null;
}

function getWindowsHardwareId(): string | null {
  try {
    const output = execSync('wmic csproduct get uuid /value', { 
      encoding: 'utf8',
      timeout: 5000
    });
    const match = output.match(/UUID=([A-F0-9-]+)/i);
    if (match && match[1]) {
      return createHash('sha256').update(match[1]).digest('hex').substring(0, 16);
    }
  } catch (error) {
    // Ignore and continue
  }
  return null;
}

function getFallbackDeviceId(): string {
  const fallbackPath = join(homedir(), '.payu-ble-id');
  
  try {
    if (existsSync(fallbackPath)) {
      const stored = readFileSync(fallbackPath, 'utf8').trim();
      if (stored && stored.length > 0) {
        return stored;
      }
    }
  } catch (error) {
    // Ignore and generate new one
  }

  // Generate new UUID and store it
  const uuid = generateUUID();
  const deviceId = createHash('sha256').update(uuid).digest('hex').substring(0, 16);
  
  try {
    writeFileSync(fallbackPath, deviceId, 'utf8');
  } catch (error) {
    // If we can't write to disk, just return the generated ID
  }
  
  return deviceId;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}