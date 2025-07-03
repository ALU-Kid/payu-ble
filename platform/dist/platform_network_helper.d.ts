/**
 * Network MAC Address Detection Helper
 * Requires: npm install arp-a ping
 */
interface NetworkScanOptions {
    timeout?: number;
    retries?: number;
    scanSubnet?: boolean;
    subnet?: string;
}
export declare class NetworkMACHelper {
    private cachedMACs;
    private lastScanTime;
    private cacheTimeout;
    private options;
    constructor(options?: NetworkScanOptions);
    private normalizeMAC;
    private getARPTable;
    private pingSubnet;
    private pingHost;
    scanForMAC(targetMAC: string): Promise<boolean>;
    getAllDiscoveredMACs(): Promise<string[]>;
    clearCache(): void;
}
export declare function createMACNetworkTrigger(targetMAC: string, options?: NetworkScanOptions): () => boolean;
export declare function macOnNetwork(mac: string): () => boolean;
export declare function discoverLocalDevices(options?: NetworkScanOptions): Promise<string[]>;
export declare function isDeviceOnNetwork(mac: string, options?: NetworkScanOptions): Promise<boolean>;
export {};
//# sourceMappingURL=platform_network_helper.d.ts.map