"use strict";
/**
 * GPIO Button Helper for Raspberry Pi
 * Requires: npm install onoff
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GPIOButtonHelper = void 0;
exports.createGPIOButtonTrigger = createGPIOButtonTrigger;
exports.gpioButton = gpioButton;
const onoff_1 = require("onoff");
class GPIOButtonHelper {
    constructor(options) {
        this.gpio = null;
        this.isPressed = false;
        this.debounceTimer = null;
        this.options = {
            edge: 'both',
            activeLow: false,
            debounceTimeout: 50,
            ...options
        };
        this.initializeGPIO();
    }
    initializeGPIO() {
        try {
            if (!onoff_1.Gpio.accessible) {
                console.warn('GPIO not accessible. Running in mock mode.');
                return;
            }
            this.gpio = new onoff_1.Gpio(this.options.pin, 'in', this.options.edge, {
                activeLow: this.options.activeLow || false
            });
            this.gpio.watch((err, value) => {
                if (err) {
                    console.error('GPIO watch error:', err);
                    return;
                }
                this.handleButtonChange(value);
            });
            // Read initial state
            this.isPressed = this.gpio.readSync() === 1;
        }
        catch (error) {
            console.error('Failed to initialize GPIO:', error);
            console.warn('Falling back to mock mode');
        }
    }
    handleButtonChange(value) {
        // Debounce button presses
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
            const wasPressed = this.isPressed;
            this.isPressed = value === 1;
            // Log state changes for debugging
            if (wasPressed !== this.isPressed) {
                console.log(`GPIO Pin ${this.options.pin}: ${this.isPressed ? 'PRESSED' : 'RELEASED'}`);
            }
        }, this.options.debounceTimeout);
    }
    getState() {
        if (this.gpio && onoff_1.Gpio.accessible) {
            try {
                return this.gpio.readSync() === 1;
            }
            catch (error) {
                console.error('Error reading GPIO state:', error);
                return this.isPressed;
            }
        }
        // Mock mode - return current state
        return this.isPressed;
    }
    isButtonPressed() {
        return this.getState();
    }
    cleanup() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        if (this.gpio) {
            this.gpio.unexport();
            this.gpio = null;
        }
    }
    // Mock methods for testing without hardware
    mockPress() {
        console.log(`Mock: Button ${this.options.pin} pressed`);
        this.isPressed = true;
    }
    mockRelease() {
        console.log(`Mock: Button ${this.options.pin} released`);
        this.isPressed = false;
    }
}
exports.GPIOButtonHelper = GPIOButtonHelper;
// Factory function for creating GPIO availability triggers
function createGPIOButtonTrigger(pin, options) {
    const buttonHelper = new GPIOButtonHelper({ pin, ...options });
    // Cleanup on process exit
    process.on('SIGINT', () => buttonHelper.cleanup());
    process.on('SIGTERM', () => buttonHelper.cleanup());
    return () => buttonHelper.isButtonPressed();
}
// Alternative simpler interface
function gpioButton(pin, activeLow = false) {
    return createGPIOButtonTrigger(pin, { activeLow });
}
//# sourceMappingURL=platform_gpio_helper.js.map