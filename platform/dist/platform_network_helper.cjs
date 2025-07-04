'use strict';

var child_process = require('child_process');
var util = require('util');

// platform/platform_network_helper.ts
var execAsync = util.promisify(child_process.exec);
var NetworkMACHelper = class {
  constructor(options = {}) {
    this.cachedMACs = /* @__PURE__ */ new Set();
    this.lastScanTime = 0;
    this.cacheTimeout = 3e4;
    this.options = {
      timeout: 5e3,
      retries: 2,
      scanSubnet: false,
      subnet: "192.168.1.0/24",
      ...options
    };
  }
  normalizeMAC(mac) {
    return mac.replace(/[:-]/g, "").toLowerCase();
  }
  async getARPTable() {
    try {
      let command;
      if (process.platform === "win32") {
        command = "arp -a";
      } else if (process.platform === "darwin") {
        command = "arp -a";
      } else {
        command = "arp -a";
      }
      const { stdout } = await execAsync(command, { timeout: this.options.timeout });
      const macs = /* @__PURE__ */ new Set();
      const lines = stdout.split("\n");
      for (const line of lines) {
        const macMatch = line.match(/([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}/);
        if (macMatch) {
          macs.add(this.normalizeMAC(macMatch[0]));
        }
      }
      return macs;
    } catch (error) {
      console.error("Error getting ARP table:", error);
      return /* @__PURE__ */ new Set();
    }
  }
  async pingSubnet() {
    if (!this.options.scanSubnet || !this.options.subnet) {
      return;
    }
    try {
      const baseIP = this.options.subnet.split("/")[0].split(".").slice(0, 3).join(".");
      const pingPromises = [];
      for (let i = 1; i <= 254; i++) {
        const ip = `${baseIP}.${i}`;
        const pingPromise = this.pingHost(ip).catch(() => {
        });
        pingPromises.push(pingPromise);
      }
      await Promise.allSettled(pingPromises.slice(0, 50));
    } catch (error) {
      console.error("Error pinging subnet:", error);
    }
  }
  async pingHost(ip) {
    const pingCommand = process.platform === "win32" ? `ping -n 1 -w 1000 ${ip}` : `ping -c 1 -W 1 ${ip}`;
    await execAsync(pingCommand, { timeout: 2e3 });
  }
  async scanForMAC(targetMAC) {
    const normalizedTarget = this.normalizeMAC(targetMAC);
    const now = Date.now();
    if (now - this.lastScanTime < this.cacheTimeout && this.cachedMACs.has(normalizedTarget)) {
      return true;
    }
    try {
      if (this.options.scanSubnet) {
        await this.pingSubnet();
      }
      const discoveredMACs = await this.getARPTable();
      this.cachedMACs = discoveredMACs;
      this.lastScanTime = now;
      return discoveredMACs.has(normalizedTarget);
    } catch (error) {
      console.error("Error scanning for MAC:", error);
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
};
function createMACNetworkTrigger(targetMAC, options) {
  const networkHelper = new NetworkMACHelper(options);
  let isAvailable = false;
  const scanInterval = setInterval(async () => {
    try {
      isAvailable = await networkHelper.scanForMAC(targetMAC);
    } catch (error) {
      console.error("MAC scan error:", error);
      isAvailable = false;
    }
  }, 1e4);
  const cleanup = () => {
    clearInterval(scanInterval);
  };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  return () => isAvailable;
}
function macOnNetwork(mac) {
  return createMACNetworkTrigger(mac, { scanSubnet: true });
}
async function discoverLocalDevices(options) {
  const helper = new NetworkMACHelper(options);
  return helper.getAllDiscoveredMACs();
}
async function isDeviceOnNetwork(mac, options) {
  const helper = new NetworkMACHelper(options);
  return helper.scanForMAC(mac);
}

exports.NetworkMACHelper = NetworkMACHelper;
exports.createMACNetworkTrigger = createMACNetworkTrigger;
exports.discoverLocalDevices = discoverLocalDevices;
exports.isDeviceOnNetwork = isDeviceOnNetwork;
exports.macOnNetwork = macOnNetwork;
//# sourceMappingURL=platform_network_helper.cjs.map
//# sourceMappingURL=platform_network_helper.cjs.map