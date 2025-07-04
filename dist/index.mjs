import { createHash } from 'crypto';

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
    return createHash("sha256").update(Date.now().toString() + Math.random().toString()).digest("hex").substring(0, 16);
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
    const fullHash = createHash("sha256").update(input).digest("hex");
    const answer = (parseInt(fullHash.substring(0, 8), 16) % 100).toString();
    return {
      prompt: `What is (SHA256("${this.deviceId}${timestamp}")) % 100?`,
      answer
    };
  }
  createChallenge(options) {
    const id = createHash("sha256").update(Date.now().toString() + Math.random().toString()).digest("hex").substring(0, 12);
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

export { PayuBLE, clearChallenge, createChallenge, index_default as default, getCurrentChallenge, getDeviceId, helpers, isDeviceAvailable, setBLEAvailability, verifyAnswer };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map