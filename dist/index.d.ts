export interface ChallengeOptions {
    type: 'arithmetic' | 'hash' | 'custom';
    difficulty?: 1 | 2 | 3 | 4;
    formula?: () => string;
    validate?: (input: string) => boolean;
    validAnswers?: string[];
    caseInsensitive?: boolean;
    ttl?: number;
}
export interface Challenge {
    id: string;
    type: string;
    prompt: string;
    createdAt: number;
    expiresAt: number | undefined;
    validate: (input: string) => boolean;
}
export interface PayuBLEState {
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
export declare const helpers: {
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
export { PayuBLE };
export declare const createChallenge: (options: ChallengeOptions) => Challenge;
export declare const verifyAnswer: (input: string) => boolean;
export declare const setBLEAvailability: (triggerFn: () => boolean) => void;
export declare const getCurrentChallenge: () => Challenge | null;
export declare const isDeviceAvailable: () => boolean;
export declare const getDeviceId: () => string;
export declare const clearChallenge: () => void;
export default PayuBLE;
//# sourceMappingURL=index.d.ts.map