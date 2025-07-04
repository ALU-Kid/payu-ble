interface ChallengeOptions {
    type: 'arithmetic' | 'hash' | 'custom';
    difficulty?: 1 | 2 | 3 | 4;
    formula?: () => string;
    validate?: (input: string) => boolean;
    validAnswers?: string[];
    caseInsensitive?: boolean;
    ttl?: number;
}
interface Challenge {
    id: string;
    type: string;
    prompt: string;
    createdAt: number;
    expiresAt: number | undefined;
    validate: (input: string) => boolean;
}
interface PayuBLEState {
    currentChallenge: Challenge | null;
    isAvailable: boolean;
    availabilityTrigger: (() => boolean) | null;
}
declare class PayuBLE {
    private state;
    private deviceId;
    constructor(deviceId?: string);
    private generateDeviceId;
    private generateArithmeticChallenge;
    private generateHashChallenge;
    createChallenge(options: ChallengeOptions): Challenge;
    verifyAnswer(input: string): boolean;
    setBLEAvailability(triggerFn: () => boolean): void;
    private updateAvailability;
    getCurrentChallenge(): Challenge | null;
    isDeviceAvailable(): boolean;
    getDeviceId(): string;
    clearChallenge(): void;
    getState(): PayuBLEState;
    private isDevelopmentMode;
}
declare const helpers: {
    timeBased: (hours: number[]) => (() => boolean);
    gpioButton: (_pin: number) => (() => boolean);
    macOnNetwork: (_mac: string) => (() => boolean);
    gpsLocation: (_zone: {
        lat: number;
        lng: number;
        radius: number;
    }) => (() => boolean);
    alwaysAvailable: () => (() => boolean);
    scheduleBasedAvailability: (schedule: {
        start: string;
        end: string;
    }[]) => (() => boolean);
};

declare const createChallenge: (options: ChallengeOptions) => Challenge;
declare const verifyAnswer: (input: string) => boolean;
declare const setBLEAvailability: (triggerFn: () => boolean) => void;
declare const getCurrentChallenge: () => Challenge | null;
declare const isDeviceAvailable: () => boolean;
declare const getDeviceId: () => string;
declare const clearChallenge: () => void;

export { type Challenge, type ChallengeOptions, PayuBLE, type PayuBLEState, clearChallenge, createChallenge, PayuBLE as default, getCurrentChallenge, getDeviceId, helpers, isDeviceAvailable, setBLEAvailability, verifyAnswer };
