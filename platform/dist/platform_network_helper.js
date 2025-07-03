"use strict";
/**
 * Network MAC Address Detection Helper
 * Requires: npm install arp-a ping
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkMACHelper = void 0;
exports.createMACNetworkTrigger = createMACNetworkTrigger;
exports.macOnNetwork = macOnNetwork;
exports.discoverLocalDevices = discoverLocalDevices;
exports.isDeviceOnNetwork = isDeviceOnNetwork;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class NetworkMACHelper {
    constructor(options = {}) {
        this.cachedMACs = new Set();
        this.lastScanTime = 0;
        this.cacheTimeout = 30000; // 30 seconds
        this.options = {
            timeout: 5000,
            retries: 2,
            scanSubnet: false,
            subnet: '192.168.1.0/24',
            ...options
        };
    }
    normalizeMAC(mac) {
        // Normalize MAC address format (remove separators, lowercase)
        return mac.replace(/[:-]/g, '').toLowerCase();
    }
    async getARPTable() {
        try {
            let command;
            // Platform-specific ARP commands
            if (process.platform === 'win32') {
                command = 'arp -a';
            }
            else if (process.platform === 'darwin') {
                command = 'arp -a';
            }
            else {
                // Linux and others
                command = 'arp -a';
            }
            const { stdout } = await execAsync(command, { timeout: this.options.timeout });
            const macs = new Set();
            // Parse ARP table output
            const lines = stdout.split('\n');
            for (const line of lines) {
                // Match MAC addresses in various formats
                const macMatch = line.match(/([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}/);
                if (macMatch) {
                    macs.add(this.normalizeMAC(macMatch[0]));
                }
            }
            return macs;
        }
        catch (error) {
            console.error('Error getting ARP table:', error);
            return new Set();
        }
    }
    async pingSubnet() {
        if (!this.options.scanSubnet || !this.options.subnet) {
            return;
        }
        try {
            // Extract network portion (simplified for common cases)
            const baseIP = this.options.subnet.split('/')[0].split('.').slice(0, 3).join('.');
            // Ping common IP addresses to populate ARP table
            const pingPromises = [];
            for (let i = 1; i <= 254; i++) {
                const ip = `${baseIP}.${i}`;
                const pingPromise = this.pingHost(ip).catch(() => {
                    // Ignore ping failures - we just want to populate ARP table
                });
                pingPromises.push(pingPromise);
            }
            // Wait for a reasonable number of pings to complete
            await Promise.allSettled(pingPromises.slice(0, 50));
        }
        catch (error) {
            console.error('Error pinging subnet:', error);
        }
    }
    async pingHost(ip) {
        const pingCommand = process.platform === 'win32'
            ? `ping -n 1 -w 1000 ${ip}`
            : `ping -c 1 -W 1 ${ip}`;
        await execAsync(pingCommand, { timeout: 2000 });
    }
    async scanForMAC(targetMAC) {
        const normalizedTarget = this.normalizeMAC(targetMAC);
        // Check cache first
        const now = Date.now();
        if (now - this.lastScanTime < this.cacheTimeout && this.cachedMACs.has(normalizedTarget)) {
            return true;
        }
        try {
            // Optionally ping subnet to populate ARP table
            if (this.options.scanSubnet) {
                await this.pingSubnet();
            }
            // Get current ARP table
            const discoveredMACs = await this.getARPTable();
            // Update cache
            this.cachedMACs = discoveredMACs;
            this.lastScanTime = now;
            return discoveredMACs.has(normalizedTarget);
        }
        catch (error) {
            console.error('Error scanning for MAC:', error);
            return false;
        }
    }
    async getAllDiscoveredMACs() {
        await this.getARPTable();
        return Array.from(this.cachedMACs);
    }
    clearCache() {
        this.cachedMACs.clear();
        this.lastScanTime = 0;
    }
}
exports.NetworkMACHelper = NetworkMACHelper;
// Factory function for creating MAC-based availability triggers
function createMACNetworkTrigger(targetMAC, options) {
    const networkHelper = new NetworkMACHelper(options);
    let isAvailable = false;
    // Periodically scan for the MAC address
    const scanInterval = setInterval(async () => {
        try {
            isAvailable = await networkHelper.scanForMAC(targetMAC);
        }
        catch (error) {
            console.error('MAC scan error:', error);
            isAvailable = false;
        }
    }, 10000); // Scan every 10 seconds
    // Cleanup on process exit
    const cleanup = () => {
        clearInterval(scanInterval);
    };
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    return () => isAvailable;
}
// Simpler interface matching the original helper
function macOnNetwork(mac) {
    return createMACNetworkTrigger(mac, { scanSubnet: true });
}
// Additional utility functions
async function discoverLocalDevices(options) {
    const helper = new NetworkMACHelper(options);
    return helper.getAllDiscoveredMACs();
}
async function isDeviceOnNetwork(mac, options) {
    const helper = new NetworkMACHelper(options);
    return helper.scanForMAC(mac);
}
//# sourceMappingURL=platform_network_helper.js.map