"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearChallenge = exports.getDeviceId = exports.isDeviceAvailable = exports.getCurrentChallenge = exports.setBLEAvailability = exports.verifyAnswer = exports.createChallenge = exports.PayuBLE = exports.helpers = void 0;
// src/index.ts
const crypto_1 = require("crypto");
class PayuBLE {
    constructor(deviceId) {
        this.state = {
            currentChallenge: null,
            isAvailable: false,
            availabilityTrigger: null
        };
        this.deviceId = deviceId || this.generateDeviceId();
    }
    generateDeviceId() {
        return (0, crypto_1.createHash)('sha256')
            .update(Date.now().toString() + Math.random().toString())
            .digest('hex')
            .substring(0, 16);
    }
    generateArithmeticChallenge(difficulty = 1) {
        const operations = ['+', '-', '*'];
        switch (difficulty) {
            case 1: {
                const a = Math.floor(Math.random() * 10) + 1;
                const b = Math.floor(Math.random() * 10) + 1;
                const op = operations[Math.floor(Math.random() * 2)]; // + or -
                const answer = op === '+' ? a + b : a - b;
                return { prompt: `${a} ${op} ${b}`, answer };
            }
            case 2: {
                const a = Math.floor(Math.random() * 20) + 1;
                const b = Math.floor(Math.random() * 12) + 1;
                const op = operations[Math.floor(Math.random() * 3)];
                let answer;
                switch (op) {
                    case '+':
                        answer = a + b;
                        break;
                    case '-':
                        answer = a - b;
                        break;
                    case '*':
                        answer = a * b;
                        break;
                    default: answer = a + b;
                }
                return { prompt: `${a} ${op} ${b}`, answer };
            }
            case 3: {
                const a = Math.floor(Math.random() * 50) + 10;
                const b = Math.floor(Math.random() * 20) + 2;
                const c = Math.floor(Math.random() * 10) + 1;
                const answer = a + (b * c);
                return { prompt: `${a} + ${b} × ${c}`, answer };
            }
            case 4: {
                const a = Math.floor(Math.random() * 100) + 50;
                const b = Math.floor(Math.random() * 20) + 5;
                const c = Math.floor(Math.random() * 15) + 3;
                const d = Math.floor(Math.random() * 8) + 2;
                const answer = (a + b) * c - d;
                return { prompt: `(${a} + ${b}) × ${c} - ${d}`, answer };
            }
            default:
                return this.generateArithmeticChallenge(1);
        }
    }
    generateHashChallenge() {
        const timestamp = Date.now();
        const input = `${this.deviceId}${timestamp}`;
        const fullHash = (0, crypto_1.createHash)('sha256').update(input).digest('hex');
        const answer = (parseInt(fullHash.substring(0, 8), 16) % 100).toString();
        return {
            prompt: `What is (SHA256("${this.deviceId}${timestamp}")) % 100?`,
            answer
        };
    }
    createChallenge(options) {
        const id = (0, crypto_1.createHash)('sha256')
            .update(Date.now().toString() + Math.random().toString())
            .digest('hex')
            .substring(0, 12);
        const createdAt = Date.now();
        const expiresAt = options.ttl ? createdAt + options.ttl : undefined;
        let prompt;
        let validator;
        switch (options.type) {
            case 'arithmetic': {
                const { prompt: mathPrompt, answer } = this.generateArithmeticChallenge(options.difficulty);
                prompt = `Solve: ${mathPrompt}`;
                validator = (input) => {
                    const numInput = parseInt(input.trim());
                    return !isNaN(numInput) && numInput === answer;
                };
                break;
            }
            case 'hash': {
                const { prompt: hashPrompt, answer } = this.generateHashChallenge();
                prompt = hashPrompt;
                validator = (input) => input.trim() === answer;
                break;
            }
            case 'custom': {
                if (!options.formula) {
                    throw new Error('Custom challenge requires a formula function');
                }
                prompt = options.formula();
                if (options.validate) {
                    validator = options.validate;
                }
                else if (options.validAnswers) {
                    validator = (input) => {
                        const processedInput = options.caseInsensitive
                            ? input.trim().toLowerCase()
                            : input.trim();
                        const processedAnswers = options.caseInsensitive
                            ? options.validAnswers.map(a => a.toLowerCase())
                            : options.validAnswers;
                        return processedAnswers.includes(processedInput);
                    };
                }
                else {
                    throw new Error('Custom challenge requires either validate function or validAnswers array');
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
            throw new Error('No active challenge');
        }
        // Check if challenge has expired
        if (this.state.currentChallenge.expiresAt && Date.now() > this.state.currentChallenge.expiresAt) {
            this.state.currentChallenge = null;
            throw new Error('Challenge has expired');
        }
        try {
            return this.state.currentChallenge.validate(input);
        }
        catch (error) {
            // Handle validation errors gracefully by returning false
            if (this.isDevelopmentMode()) {
                console.warn('⚠️  PayuBLE: Validation function threw an error:', error);
                console.warn('   Challenge ID:', this.state.currentChallenge.id);
                console.warn('   Challenge Type:', this.state.currentChallenge.type);
                console.warn('   Input:', JSON.stringify(input));
                console.warn('   Consider adding proper error handling in your validation function.');
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
            }
            catch (error) {
                // Handle availability trigger errors gracefully by setting to false
                if (this.isDevelopmentMode()) {
                    console.warn('⚠️  PayuBLE: Availability trigger threw an error:', error);
                    console.warn('   Device ID:', this.deviceId);
                    console.warn('   Trigger function:', this.state.availabilityTrigger.toString().substring(0, 100) + '...');
                    console.warn('   Consider adding proper error handling in your availability trigger.');
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
        // Check for common development environment indicators
        return (typeof process !== 'undefined' &&
            process.env &&
            (process.env.NODE_ENV === 'development' ||
                process.env.NODE_ENV === 'dev' ||
                process.env.NODE_ENV === 'test' ||
                !process.env.NODE_ENV) // Default to development if NODE_ENV is not set
        );
    }
}
exports.PayuBLE = PayuBLE;
// Helper functions for common availability triggers
exports.helpers = {
    timeBased: (hours) => {
        return () => {
            const currentHour = new Date().getHours();
            return hours.includes(currentHour);
        };
    },
    gpioButton: (_pin) => {
        return () => {
            // Placeholder for GPIO implementation
            // In real implementation, this would check GPIO pin state
            console.warn('GPIO helper requires platform-specific implementation');
            return true;
        };
    },
    macOnNetwork: (_mac) => {
        return () => {
            // Placeholder for network MAC detection
            // In real implementation, this would scan network for MAC address
            console.warn('MAC network helper requires platform-specific implementation');
            return true;
        };
    },
    gpsLocation: (_zone) => {
        return () => {
            // Placeholder for GPS implementation
            // In real implementation, this would check current GPS coordinates
            console.warn('GPS helper requires platform-specific implementation');
            return true;
        };
    },
    alwaysAvailable: () => {
        return () => true;
    },
    scheduleBasedAvailability: (schedule) => {
        return () => {
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();
            return schedule.some(slot => {
                const [startHour, startMin] = slot.start.split(':').map(Number);
                const [endHour, endMin] = slot.end.split(':').map(Number);
                const startTime = startHour * 60 + startMin;
                const endTime = endHour * 60 + endMin;
                return currentTime >= startTime && currentTime <= endTime;
            });
        };
    }
};
// Default instance for convenience
const defaultInstance = new PayuBLE();
const createChallenge = (options) => defaultInstance.createChallenge(options);
exports.createChallenge = createChallenge;
const verifyAnswer = (input) => defaultInstance.verifyAnswer(input);
exports.verifyAnswer = verifyAnswer;
const setBLEAvailability = (triggerFn) => defaultInstance.setBLEAvailability(triggerFn);
exports.setBLEAvailability = setBLEAvailability;
const getCurrentChallenge = () => defaultInstance.getCurrentChallenge();
exports.getCurrentChallenge = getCurrentChallenge;
const isDeviceAvailable = () => defaultInstance.isDeviceAvailable();
exports.isDeviceAvailable = isDeviceAvailable;
const getDeviceId = () => defaultInstance.getDeviceId();
exports.getDeviceId = getDeviceId;
const clearChallenge = () => defaultInstance.clearChallenge();
exports.clearChallenge = clearChallenge;
exports.default = PayuBLE;
//# sourceMappingURL=index.js.map