/**
 * GPIO Button Helper for Raspberry Pi
 * Requires: npm install onoff
 */
interface GPIOButtonOptions {
    pin: number;
    edge?: 'rising' | 'falling' | 'both';
    activeLow?: boolean;
    debounceTimeout?: number;
}
declare class GPIOButtonHelper {
    private gpio;
    private isPressed;
    private debounceTimer;
    private options;
    constructor(options: GPIOButtonOptions);
    private initializeGPIO;
    private handleButtonChange;
    getState(): boolean;
    isButtonPressed(): boolean;
    cleanup(): void;
    mockPress(): void;
    mockRelease(): void;
}
declare function createGPIOButtonTrigger(pin: number, options?: Partial<GPIOButtonOptions>): () => boolean;
declare function gpioButton(pin: number, activeLow?: boolean): () => boolean;

export { GPIOButtonHelper, createGPIOButtonTrigger, gpioButton };
