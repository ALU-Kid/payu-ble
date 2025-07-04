'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var crypto = require('crypto');
var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var os = require('os');

// src/index.ts
function getHardwareDeviceId() {
  try {
    const hardwareId = detectHardwareId();
    if (hardwareId) {
      return hardwareId;
    }
  } catch (error) {
  }
  return getFallbackDeviceId();
}
function detectHardwareId() {
  const platform = process.platform;
  try {
    switch (platform) {
      case "linux":
        return getLinuxMachineId();
      case "darwin":
        return getMacOSHardwareId();
      case "win32":
        return getWindowsHardwareId();
      default:
        return null;
    }
  } catch (error) {
    return null;
  }
}
function getLinuxMachineId() {
  const machineIdPaths = [
    "/etc/machine-id",
    "/var/lib/dbus/machine-id"
  ];
  for (const path of machineIdPaths) {
    try {
      if (fs.existsSync(path)) {
        const id = fs.readFileSync(path, "utf8").trim();
        if (id && id.length > 0) {
          return crypto.createHash("sha256").update(id).digest("hex").substring(0, 16);
        }
      }
    } catch (error) {
      continue;
    }
  }
  try {
    const cpuInfo = fs.readFileSync("/proc/cpuinfo", "utf8");
    const serialMatch = cpuInfo.match(/Serial\s*:\s*([a-f0-9]+)/i);
    if (serialMatch && serialMatch[1]) {
      return crypto.createHash("sha256").update(serialMatch[1]).digest("hex").substring(0, 16);
    }
  } catch (error) {
  }
  return null;
}
function getMacOSHardwareId() {
  try {
    const output = child_process.execSync('system_profiler SPHardwareDataType | grep "Hardware UUID"', {
      encoding: "utf8",
      timeout: 5e3
    });
    const match = output.match(/Hardware UUID:\s*([A-F0-9-]+)/i);
    if (match && match[1]) {
      return crypto.createHash("sha256").update(match[1]).digest("hex").substring(0, 16);
    }
  } catch (error) {
  }
  return null;
}
function getWindowsHardwareId() {
  try {
    const output = child_process.execSync("wmic csproduct get uuid /value", {
      encoding: "utf8",
      timeout: 5e3
    });
    const match = output.match(/UUID=([A-F0-9-]+)/i);
    if (match && match[1]) {
      return crypto.createHash("sha256").update(match[1]).digest("hex").substring(0, 16);
    }
  } catch (error) {
  }
  return null;
}
function getFallbackDeviceId() {
  const fallbackPath = path.join(os.homedir(), ".payu-ble-id");
  try {
    if (fs.existsSync(fallbackPath)) {
      const stored = fs.readFileSync(fallbackPath, "utf8").trim();
      if (stored && stored.length > 0) {
        return stored;
      }
    }
  } catch (error) {
  }
  const uuid = generateUUID();
  const deviceId = crypto.createHash("sha256").update(uuid).digest("hex").substring(0, 16);
  try {
    fs.writeFileSync(fallbackPath, deviceId, "utf8");
  } catch (error) {
  }
  return deviceId;
}
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}

// src/index.ts
var PayuBLE = class {
  constructor(deviceId) {
    this.state = {
      currentChallenge: null,
      isAvailable: false,
      availabilityTrigger: null
    };
    this.deviceId = deviceId || this.generateDeviceId();
  }
  generateDeviceId() {
    return crypto.createHash("sha256").update(Date.now().toString() + Math.random().toString()).digest("hex").substring(0, 16);
  }
  generateArithmeticChallenge(difficulty = 1) {
    const operations = ["+", "-", "*"];
    switch (difficulty) {
      case 1: {
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 10) + 1;
        const op = operations[Math.floor(Math.random() * 2)];
        const answer = op === "+" ? a + b : a - b;
        return { prompt: `${a} ${op} ${b}`, answer };
      }
      case 2: {
        const a = Math.floor(Math.random() * 20) + 1;
        const b = Math.floor(Math.random() * 12) + 1;
        const op = operations[Math.floor(Math.random() * 3)];
        let answer;
        switch (op) {
          case "+":
            answer = a + b;
            break;
          case "-":
            answer = a - b;
            break;
          case "*":
            answer = a * b;
            break;
          default:
            answer = a + b;
        }
        return { prompt: `${a} ${op} ${b}`, answer };
      }
      case 3: {
        const a = Math.floor(Math.random() * 50) + 10;
        const b = Math.floor(Math.random() * 20) + 2;
        const c = Math.floor(Math.random() * 10) + 1;
        const answer = a + b * c;
        return { prompt: `${a} + ${b} \xD7 ${c}`, answer };
      }
      case 4: {
        const a = Math.floor(Math.random() * 100) + 50;
        const b = Math.floor(Math.random() * 20) + 5;
        const c = Math.floor(Math.random() * 15) + 3;
        const d = Math.floor(Math.random() * 8) + 2;
        const answer = (a + b) * c - d;
        return { prompt: `(${a} + ${b}) \xD7 ${c} - ${d}`, answer };
      }
      default:
        return this.generateArithmeticChallenge(1);
    }
  }
  generateHashChallenge() {
    const timestamp = Date.now();
    const input = `${this.deviceId}${timestamp}`;
    const fullHash = crypto.createHash("sha256").update(input).digest("hex");
    const answer = (parseInt(fullHash.substring(0, 8), 16) % 100).toString();
    return {
      prompt: `What is (SHA256("${this.deviceId}${timestamp}")) % 100?`,
      answer
    };
  }
  createChallenge(options) {
    const id = crypto.createHash("sha256").update(Date.now().toString() + Math.random().toString()).digest("hex").substring(0, 12);
    const createdAt = Date.now();
    const expiresAt = options.ttl ? createdAt + options.ttl : void 0;
    let prompt;
    let validator;
    switch (options.type) {
      case "arithmetic": {
        const { prompt: mathPrompt, answer } = this.generateArithmeticChallenge(options.difficulty);
        prompt = `Solve: ${mathPrompt}`;
        validator = (input) => {
          const numInput = parseInt(input.trim());
          return !isNaN(numInput) && numInput === answer;
        };
        break;
      }
      case "hash": {
        const { prompt: hashPrompt, answer } = this.generateHashChallenge();
        prompt = hashPrompt;
        validator = (input) => input.trim() === answer;
        break;
      }
      case "custom": {
        if (!options.formula) {
          throw new Error("Custom challenge requires a formula function");
        }
        prompt = options.formula();
        if (options.validate) {
          validator = options.validate;
        } else if (options.validAnswers) {
          validator = (input) => {
            const processedInput = options.caseInsensitive ? input.trim().toLowerCase() : input.trim();
            const processedAnswers = options.caseInsensitive ? options.validAnswers.map((a) => a.toLowerCase()) : options.validAnswers;
            return processedAnswers.includes(processedInput);
          };
        } else {
          throw new Error("Custom challenge requires either validate function or validAnswers array");
        }
        break;
      }
      default:
        throw new Error(`Unsupported challenge type: ${options.type}`);
    }
    const challenge = {
      id,
      type: options.type,
      prompt,
      createdAt,
      expiresAt,
      validate: validator
    };
    this.state.currentChallenge = challenge;
    return challenge;
  }
  verifyAnswer(input) {
    if (!this.state.currentChallenge) {
      throw new Error("No active challenge");
    }
    if (this.state.currentChallenge.expiresAt && Date.now() > this.state.currentChallenge.expiresAt) {
      this.state.currentChallenge = null;
      throw new Error("Challenge has expired");
    }
    try {
      return this.state.currentChallenge.validate(input);
    } catch (error) {
      if (this.isDevelopmentMode()) {
        console.warn("\u26A0\uFE0F  PayuBLE: Validation function threw an error:", error);
        console.warn("   Challenge ID:", this.state.currentChallenge.id);
        console.warn("   Challenge Type:", this.state.currentChallenge.type);
        console.warn("   Input:", JSON.stringify(input));
        console.warn("   Consider adding proper error handling in your validation function.");
      }
      return false;
    }
  }
  setBLEAvailability(triggerFn) {
    this.state.availabilityTrigger = triggerFn;
    this.updateAvailability();
  }
  updateAvailability() {
    if (this.state.availabilityTrigger) {
      try {
        this.state.isAvailable = this.state.availabilityTrigger();
      } catch (error) {
        if (this.isDevelopmentMode()) {
          console.warn("\u26A0\uFE0F  PayuBLE: Availability trigger threw an error:", error);
          console.warn("   Device ID:", this.deviceId);
          console.warn("   Trigger function:", this.state.availabilityTrigger.toString().substring(0, 100) + "...");
          console.warn("   Consider adding proper error handling in your availability trigger.");
        }
        this.state.isAvailable = false;
      }
    }
  }
  getCurrentChallenge() {
    return this.state.currentChallenge;
  }
  isDeviceAvailable() {
    this.updateAvailability();
    return this.state.isAvailable;
  }
  getDeviceId() {
    return this.deviceId;
  }
  clearChallenge() {
    this.state.currentChallenge = null;
  }
  getState() {
    return { ...this.state };
  }
  isDevelopmentMode() {
    return typeof process !== "undefined" && process.env && (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "test" || !process.env.NODE_ENV);
  }
};
var helpers = {
  timeBased: (hours) => {
    return () => {
      const currentHour = (/* @__PURE__ */ new Date()).getHours();
      return hours.includes(currentHour);
    };
  },
  gpioButton: (_pin) => {
    return () => {
      console.warn("GPIO helper requires platform-specific implementation");
      return true;
    };
  },
  macOnNetwork: (_mac) => {
    return () => {
      console.warn("MAC network helper requires platform-specific implementation");
      return true;
    };
  },
  gpsLocation: (_zone) => {
    return () => {
      console.warn("GPS helper requires platform-specific implementation");
      return true;
    };
  },
  alwaysAvailable: () => {
    return () => true;
  },
  scheduleBasedAvailability: (schedule) => {
    return () => {
      const now = /* @__PURE__ */ new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      return schedule.some((slot) => {
        const [startHour, startMin] = slot.start.split(":").map(Number);
        const [endHour, endMin] = slot.end.split(":").map(Number);
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;
        return currentTime >= startTime && currentTime <= endTime;
      });
    };
  }
};
var defaultInstance = new PayuBLE();
var createChallenge = (options) => defaultInstance.createChallenge(options);
var verifyAnswer = (input) => defaultInstance.verifyAnswer(input);
var setBLEAvailability = (triggerFn) => defaultInstance.setBLEAvailability(triggerFn);
var getCurrentChallenge = () => defaultInstance.getCurrentChallenge();
var isDeviceAvailable = () => defaultInstance.isDeviceAvailable();
var getDeviceId = () => defaultInstance.getDeviceId();
var clearChallenge = () => defaultInstance.clearChallenge();
var index_default = PayuBLE;

exports.PayuBLE = PayuBLE;
exports.clearChallenge = clearChallenge;
exports.createChallenge = createChallenge;
exports.default = index_default;
exports.getCurrentChallenge = getCurrentChallenge;
exports.getDeviceId = getDeviceId;
exports.getHardwareDeviceId = getHardwareDeviceId;
exports.helpers = helpers;
exports.isDeviceAvailable = isDeviceAvailable;
exports.setBLEAvailability = setBLEAvailability;
exports.verifyAnswer = verifyAnswer;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map