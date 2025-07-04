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
declare class NetworkMACHelper {
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
declare function createMACNetworkTrigger(targetMAC: string, options?: NetworkScanOptions): () => boolean;
declare function macOnNetwork(mac: string): () => boolean;
declare function discoverLocalDevices(options?: NetworkScanOptions): Promise<string[]>;
declare function isDeviceOnNetwork(mac: string, options?: NetworkScanOptions): Promise<boolean>;

export { NetworkMACHelper, createMACNetworkTrigger, discoverLocalDevices, isDeviceOnNetwork, macOnNetwork };
