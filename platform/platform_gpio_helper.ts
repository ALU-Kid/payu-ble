/**
 * GPIO Button Helper for Raspberry Pi
 * Requires: npm install onoff
 */

import { Gpio } from 'onoff';

interface GPIOButtonOptions {
  pin: number;
  edge?: 'rising' | 'falling' | 'both';
  activeLow?: boolean;
  debounceTimeout?: number;
}

export class GPIOButtonHelper {
  private gpio: Gpio | null = null;
  private isPressed: boolean = false;
  private debounceTimer: NodeJS.Timeout | null = null;
  private options: GPIOButtonOptions;

  constructor(options: GPIOButtonOptions) {
    this.options = {
      edge: 'both',
      activeLow: false,
      debounceTimeout: 50,
      ...options
    };

    this.initializeGPIO();
  }

  private initializeGPIO(): void {
    try {
      if (!Gpio.accessible) {
        console.warn('GPIO not accessible. Running in mock mode.');
        return;
      }

      this.gpio = new Gpio(this.options.pin, 'in', this.options.edge, {
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
      
    } catch (error) {
      console.error('Failed to initialize GPIO:', error);
      console.warn('Falling back to mock mode');
    }
  }

  private handleButtonChange(value: number): void {
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

  public getState(): boolean {
    if (this.gpio && Gpio.accessible) {
      try {
        return this.gpio.readSync() === 1;
      } catch (error) {
        console.error('Error reading GPIO state:', error);
        return this.isPressed;
      }
    }
    
    // Mock mode - return current state
    return this.isPressed;
  }

  public isButtonPressed(): boolean {
    return this.getState();
  }

  public cleanup(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    if (this.gpio) {
      this.gpio.unexport();
      this.gpio = null;
    }
  }

  // Mock methods for testing without hardware
  public mockPress(): void {
    console.log(`Mock: Button ${this.options.pin} pressed`);
    this.isPressed = true;
  }

  public mockRelease(): void {
    console.log(`Mock: Button ${this.options.pin} released`);
    this.isPressed = false;
  }
}

// Factory function for creating GPIO availability triggers
export function createGPIOButtonTrigger(pin: number, options?: Partial<GPIOButtonOptions>): () => boolean {
  const buttonHelper = new GPIOButtonHelper({ pin, ...options });

  // Cleanup on process exit
  process.on('SIGINT', () => buttonHelper.cleanup());
  process.on('SIGTERM', () => buttonHelper.cleanup());

  return () => buttonHelper.isButtonPressed();
}

// Alternative simpler interface
export function gpioButton(pin: number, activeLow: boolean = false): () => boolean {
  return createGPIOButtonTrigger(pin, { activeLow });
}