'use strict';

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/lodash.debounce/index.js
var require_lodash = __commonJS({
  "node_modules/lodash.debounce/index.js"(exports, module) {
    var FUNC_ERROR_TEXT = "Expected a function";
    var NAN = 0 / 0;
    var symbolTag = "[object Symbol]";
    var reTrim = /^\s+|\s+$/g;
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
    var reIsBinary = /^0b[01]+$/i;
    var reIsOctal = /^0o[0-7]+$/i;
    var freeParseInt = parseInt;
    var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
    var freeSelf = typeof self == "object" && self && self.Object === Object && self;
    var root = freeGlobal || freeSelf || Function("return this")();
    var objectProto = Object.prototype;
    var objectToString = objectProto.toString;
    var nativeMax = Math.max;
    var nativeMin = Math.min;
    var now = function() {
      return root.Date.now();
    };
    function debounce(func, wait, options) {
      var lastArgs, lastThis, maxWait, result, timerId, lastCallTime, lastInvokeTime = 0, leading = false, maxing = false, trailing = true;
      if (typeof func != "function") {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      wait = toNumber(wait) || 0;
      if (isObject(options)) {
        leading = !!options.leading;
        maxing = "maxWait" in options;
        maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
        trailing = "trailing" in options ? !!options.trailing : trailing;
      }
      function invokeFunc(time) {
        var args = lastArgs, thisArg = lastThis;
        lastArgs = lastThis = void 0;
        lastInvokeTime = time;
        result = func.apply(thisArg, args);
        return result;
      }
      function leadingEdge(time) {
        lastInvokeTime = time;
        timerId = setTimeout(timerExpired, wait);
        return leading ? invokeFunc(time) : result;
      }
      function remainingWait(time) {
        var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime, result2 = wait - timeSinceLastCall;
        return maxing ? nativeMin(result2, maxWait - timeSinceLastInvoke) : result2;
      }
      function shouldInvoke(time) {
        var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime;
        return lastCallTime === void 0 || timeSinceLastCall >= wait || timeSinceLastCall < 0 || maxing && timeSinceLastInvoke >= maxWait;
      }
      function timerExpired() {
        var time = now();
        if (shouldInvoke(time)) {
          return trailingEdge(time);
        }
        timerId = setTimeout(timerExpired, remainingWait(time));
      }
      function trailingEdge(time) {
        timerId = void 0;
        if (trailing && lastArgs) {
          return invokeFunc(time);
        }
        lastArgs = lastThis = void 0;
        return result;
      }
      function cancel() {
        if (timerId !== void 0) {
          clearTimeout(timerId);
        }
        lastInvokeTime = 0;
        lastArgs = lastCallTime = lastThis = timerId = void 0;
      }
      function flush() {
        return timerId === void 0 ? result : trailingEdge(now());
      }
      function debounced() {
        var time = now(), isInvoking = shouldInvoke(time);
        lastArgs = arguments;
        lastThis = this;
        lastCallTime = time;
        if (isInvoking) {
          if (timerId === void 0) {
            return leadingEdge(lastCallTime);
          }
          if (maxing) {
            timerId = setTimeout(timerExpired, wait);
            return invokeFunc(lastCallTime);
          }
        }
        if (timerId === void 0) {
          timerId = setTimeout(timerExpired, wait);
        }
        return result;
      }
      debounced.cancel = cancel;
      debounced.flush = flush;
      return debounced;
    }
    function isObject(value) {
      var type = typeof value;
      return !!value && (type == "object" || type == "function");
    }
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    function isSymbol(value) {
      return typeof value == "symbol" || isObjectLike(value) && objectToString.call(value) == symbolTag;
    }
    function toNumber(value) {
      if (typeof value == "number") {
        return value;
      }
      if (isSymbol(value)) {
        return NAN;
      }
      if (isObject(value)) {
        var other = typeof value.valueOf == "function" ? value.valueOf() : value;
        value = isObject(other) ? other + "" : other;
      }
      if (typeof value != "string") {
        return value === 0 ? value : +value;
      }
      value = value.replace(reTrim, "");
      var isBinary = reIsBinary.test(value);
      return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
    }
    module.exports = debounce;
  }
});

// node_modules/file-uri-to-path/index.js
var require_file_uri_to_path = __commonJS({
  "node_modules/file-uri-to-path/index.js"(exports, module) {
    var sep = __require("path").sep || "/";
    module.exports = fileUriToPath;
    function fileUriToPath(uri) {
      if ("string" != typeof uri || uri.length <= 7 || "file://" != uri.substring(0, 7)) {
        throw new TypeError("must pass in a file:// URI to convert to a file path");
      }
      var rest = decodeURI(uri.substring(7));
      var firstSlash = rest.indexOf("/");
      var host = rest.substring(0, firstSlash);
      var path = rest.substring(firstSlash + 1);
      if ("localhost" == host) host = "";
      if (host) {
        host = sep + sep + host;
      }
      path = path.replace(/^(.+)\|/, "$1:");
      if (sep == "\\") {
        path = path.replace(/\//g, "\\");
      }
      if (/^.+\:/.test(path)) ; else {
        path = sep + path;
      }
      return host + path;
    }
  }
});

// node_modules/bindings/bindings.js
var require_bindings = __commonJS({
  "node_modules/bindings/bindings.js"(exports, module) {
    var fs = __require("fs");
    var path = __require("path");
    var fileURLToPath = require_file_uri_to_path();
    var join = path.join;
    var dirname = path.dirname;
    var exists = fs.accessSync && function(path2) {
      try {
        fs.accessSync(path2);
      } catch (e) {
        return false;
      }
      return true;
    } || fs.existsSync || path.existsSync;
    var defaults = {
      arrow: process.env.NODE_BINDINGS_ARROW || " \u2192 ",
      compiled: process.env.NODE_BINDINGS_COMPILED_DIR || "compiled",
      platform: process.platform,
      arch: process.arch,
      nodePreGyp: "node-v" + process.versions.modules + "-" + process.platform + "-" + process.arch,
      version: process.versions.node,
      bindings: "bindings.node",
      try: [
        // node-gyp's linked version in the "build" dir
        ["module_root", "build", "bindings"],
        // node-waf and gyp_addon (a.k.a node-gyp)
        ["module_root", "build", "Debug", "bindings"],
        ["module_root", "build", "Release", "bindings"],
        // Debug files, for development (legacy behavior, remove for node v0.9)
        ["module_root", "out", "Debug", "bindings"],
        ["module_root", "Debug", "bindings"],
        // Release files, but manually compiled (legacy behavior, remove for node v0.9)
        ["module_root", "out", "Release", "bindings"],
        ["module_root", "Release", "bindings"],
        // Legacy from node-waf, node <= 0.4.x
        ["module_root", "build", "default", "bindings"],
        // Production "Release" buildtype binary (meh...)
        ["module_root", "compiled", "version", "platform", "arch", "bindings"],
        // node-qbs builds
        ["module_root", "addon-build", "release", "install-root", "bindings"],
        ["module_root", "addon-build", "debug", "install-root", "bindings"],
        ["module_root", "addon-build", "default", "install-root", "bindings"],
        // node-pre-gyp path ./lib/binding/{node_abi}-{platform}-{arch}
        ["module_root", "lib", "binding", "nodePreGyp", "bindings"]
      ]
    };
    function bindings(opts) {
      if (typeof opts == "string") {
        opts = { bindings: opts };
      } else if (!opts) {
        opts = {};
      }
      Object.keys(defaults).map(function(i2) {
        if (!(i2 in opts)) opts[i2] = defaults[i2];
      });
      if (!opts.module_root) {
        opts.module_root = exports.getRoot(exports.getFileName());
      }
      if (path.extname(opts.bindings) != ".node") {
        opts.bindings += ".node";
      }
      var requireFunc = typeof __webpack_require__ === "function" ? __non_webpack_require__ : __require;
      var tries = [], i = 0, l = opts.try.length, n, b, err;
      for (; i < l; i++) {
        n = join.apply(
          null,
          opts.try[i].map(function(p) {
            return opts[p] || p;
          })
        );
        tries.push(n);
        try {
          b = opts.path ? requireFunc.resolve(n) : requireFunc(n);
          if (!opts.path) {
            b.path = n;
          }
          return b;
        } catch (e) {
          if (e.code !== "MODULE_NOT_FOUND" && e.code !== "QUALIFIED_PATH_RESOLUTION_FAILED" && !/not find/i.test(e.message)) {
            throw e;
          }
        }
      }
      err = new Error(
        "Could not locate the bindings file. Tried:\n" + tries.map(function(a) {
          return opts.arrow + a;
        }).join("\n")
      );
      err.tries = tries;
      throw err;
    }
    module.exports = exports = bindings;
    exports.getFileName = function getFileName(calling_file) {
      var origPST = Error.prepareStackTrace, origSTL = Error.stackTraceLimit, dummy = {}, fileName;
      Error.stackTraceLimit = 10;
      Error.prepareStackTrace = function(e, st) {
        for (var i = 0, l = st.length; i < l; i++) {
          fileName = st[i].getFileName();
          if (fileName !== __filename) {
            if (calling_file) {
              if (fileName !== calling_file) {
                return;
              }
            } else {
              return;
            }
          }
        }
      };
      Error.captureStackTrace(dummy);
      dummy.stack;
      Error.prepareStackTrace = origPST;
      Error.stackTraceLimit = origSTL;
      var fileSchema = "file://";
      if (fileName.indexOf(fileSchema) === 0) {
        fileName = fileURLToPath(fileName);
      }
      return fileName;
    };
    exports.getRoot = function getRoot(file) {
      var dir = dirname(file), prev;
      while (true) {
        if (dir === ".") {
          dir = process.cwd();
        }
        if (exists(join(dir, "package.json")) || exists(join(dir, "node_modules"))) {
          return dir;
        }
        if (prev === dir) {
          throw new Error(
            'Could not find module root given file: "' + file + '". Do you have a `package.json` file? '
          );
        }
        prev = dir;
        dir = join(dir, "..");
      }
    };
  }
});

// node_modules/epoll/epoll.js
var require_epoll = __commonJS({
  "node_modules/epoll/epoll.js"(exports, module) {
    module.exports = ((_) => {
      const osType = __require("os").type();
      if (osType === "Linux") {
        return require_bindings()("epoll.node");
      }
      console.warn(`Warning: epoll is built for Linux and not intended for usage on ${osType}.`);
      return {
        Epoll: {}
      };
    })();
  }
});

// node_modules/onoff/onoff.js
var require_onoff = __commonJS({
  "node_modules/onoff/onoff.js"(exports, module) {
    var fs = __require("fs");
    var debounce = require_lodash();
    var Epoll = require_epoll().Epoll;
    var GPIO_ROOT_PATH = "/sys/class/gpio/";
    var HIGH_BUF = Buffer.from("1");
    var LOW_BUF = Buffer.from("0");
    var HIGH = 1;
    var LOW = 0;
    var exportGpio = (gpio) => {
      if (!fs.existsSync(gpio._gpioPath)) {
        fs.writeFileSync(GPIO_ROOT_PATH + "export", "" + gpio._gpio);
        return false;
      }
      return true;
    };
    var waitForGpioAccessPermission = (gpio, direction, edge, gpioPreviouslyExported) => {
      let permissionRequiredPaths = [
        gpio._gpioPath + "value"
      ];
      if (gpioPreviouslyExported === false) {
        permissionRequiredPaths.push(gpio._gpioPath + "direction");
        permissionRequiredPaths.push(gpio._gpioPath + "active_low");
        if (edge && direction === "in") {
          permissionRequiredPaths.push(gpio._gpioPath + "edge");
        }
      }
      permissionRequiredPaths.forEach((path) => {
        let tries = 0;
        while (true) {
          try {
            tries += 1;
            const fd = fs.openSync(path, "r+");
            fs.closeSync(fd);
            break;
          } catch (e) {
            if (tries === 1e4) {
              throw e;
            }
          }
        }
      });
    };
    var configureGpio = (gpio, direction, edge, options, gpioPreviouslyExported) => {
      const throwIfNeeded = (err) => {
        if (gpioPreviouslyExported === false) {
          throw err;
        }
      };
      try {
        if (typeof options.activeLow === "boolean") {
          gpio.setActiveLow(options.activeLow);
        }
      } catch (err) {
        throwIfNeeded(err);
      }
      try {
        const reconfigureDirection = typeof options.reconfigureDirection === "boolean" ? options.reconfigureDirection : true;
        const requestedDirection = direction === "high" || direction === "low" ? "out" : direction;
        if (reconfigureDirection || gpio.direction() !== requestedDirection) {
          gpio.setDirection(direction);
        }
      } catch (err) {
        throwIfNeeded(err);
      }
      try {
        if (edge && direction === "in") {
          gpio.setEdge(edge);
        }
      } catch (err) {
        throwIfNeeded(err);
      }
    };
    var configureInterruptHandler = (gpio) => {
      const pollerEventHandler = (err, fd, events) => {
        const value = gpio.readSync();
        if (value === LOW && gpio._fallingEnabled || value === HIGH && gpio._risingEnabled) {
          gpio._listeners.slice(0).forEach((callback) => {
            callback(err, value);
          });
        }
      };
      gpio.readSync();
      if (gpio._debounceTimeout > 0) {
        const db = debounce(pollerEventHandler, gpio._debounceTimeout);
        gpio._poller = new Epoll((err, fd, events) => {
          gpio.readSync();
          db(err, fd, events);
        });
      } else {
        gpio._poller = new Epoll(pollerEventHandler);
      }
    };
    var Gpio2 = class {
      constructor(gpio, direction, edge, options) {
        if (typeof edge === "object" && !options) {
          options = edge;
          edge = void 0;
        }
        options = options || {};
        this._gpio = gpio;
        this._gpioPath = GPIO_ROOT_PATH + "gpio" + this._gpio + "/";
        this._debounceTimeout = options.debounceTimeout || 0;
        this._readBuffer = Buffer.alloc(16);
        this._readSyncBuffer = Buffer.alloc(16);
        this._listeners = [];
        const gpioPreviouslyExported = exportGpio(this);
        waitForGpioAccessPermission(
          this,
          direction,
          edge,
          gpioPreviouslyExported
        );
        configureGpio(this, direction, edge, options, gpioPreviouslyExported);
        this._valueFd = fs.openSync(this._gpioPath + "value", "r+");
        configureInterruptHandler(this);
      }
      read(callback) {
        const readValue = (callback2) => {
          fs.read(this._valueFd, this._readBuffer, 0, 1, 0, (err, bytes, buf) => {
            if (typeof callback2 === "function") {
              if (err) {
                return callback2(err);
              }
              callback2(null, convertBufferToBit(buf));
            }
          });
        };
        if (callback) {
          readValue(callback);
        } else {
          return new Promise((resolve, reject) => {
            readValue((err, value) => {
              if (err) {
                reject(err);
              } else {
                resolve(value);
              }
            });
          });
        }
      }
      readSync() {
        fs.readSync(this._valueFd, this._readSyncBuffer, 0, 1, 0);
        return convertBufferToBit(this._readSyncBuffer);
      }
      write(value, callback) {
        const writeValue = (value2, callback2) => {
          const writeBuffer = convertBitToBuffer(value2);
          fs.write(
            this._valueFd,
            writeBuffer,
            0,
            writeBuffer.length,
            0,
            callback2
          );
        };
        if (callback) {
          writeValue(value, callback);
        } else {
          return new Promise((resolve, reject) => {
            writeValue(value, (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });
        }
      }
      writeSync(value) {
        const writeBuffer = convertBitToBuffer(value);
        fs.writeSync(this._valueFd, writeBuffer, 0, writeBuffer.length, 0);
      }
      watch(callback) {
        this._listeners.push(callback);
        if (this._listeners.length === 1) {
          this._poller.add(this._valueFd, Epoll.EPOLLPRI);
        }
      }
      unwatch(callback) {
        if (this._listeners.length > 0) {
          if (typeof callback !== "function") {
            this._listeners = [];
          } else {
            this._listeners = this._listeners.filter((listener) => {
              return callback !== listener;
            });
          }
          if (this._listeners.length === 0) {
            this._poller.remove(this._valueFd);
          }
        }
      }
      unwatchAll() {
        this.unwatch();
      }
      direction() {
        return fs.readFileSync(this._gpioPath + "direction").toString().trim();
      }
      setDirection(direction) {
        fs.writeFileSync(this._gpioPath + "direction", direction);
      }
      edge() {
        return fs.readFileSync(this._gpioPath + "edge").toString().trim();
      }
      setEdge(edge) {
        fs.writeFileSync(this._gpioPath + "edge", edge);
        this._risingEnabled = edge === "both" || edge === "rising";
        this._fallingEnabled = edge === "both" || edge === "falling";
      }
      activeLow() {
        return convertBufferToBoolean(
          fs.readFileSync(this._gpioPath + "active_low")
        );
      }
      setActiveLow(invert) {
        fs.writeFileSync(
          this._gpioPath + "active_low",
          convertBooleanToBuffer(!!invert)
        );
      }
      unexport() {
        this.unwatchAll();
        fs.closeSync(this._valueFd);
        try {
          fs.writeFileSync(GPIO_ROOT_PATH + "unexport", "" + this._gpio);
        } catch (ignore) {
        }
      }
      static get accessible() {
        let fd;
        try {
          fd = fs.openSync(GPIO_ROOT_PATH + "export", fs.constants.O_WRONLY);
        } catch (e) {
          return false;
        } finally {
          if (fd) {
            fs.closeSync(fd);
          }
        }
        return true;
      }
    };
    var convertBitToBuffer = (bit) => convertBooleanToBuffer(bit === HIGH);
    var convertBufferToBit = (buffer) => convertBufferToBoolean(buffer) ? HIGH : LOW;
    var convertBooleanToBuffer = (boolean) => boolean ? HIGH_BUF : LOW_BUF;
    var convertBufferToBoolean = (buffer) => buffer[0] === HIGH_BUF[0];
    Gpio2.HIGH = HIGH;
    Gpio2.LOW = LOW;
    module.exports.Gpio = Gpio2;
  }
});

// platform/platform_gpio_helper.ts
var Gpio = null;
async function loadGpio() {
  try {
    const onoffModule = await Promise.resolve().then(() => __toESM(require_onoff()));
    return onoffModule.Gpio;
  } catch (error) {
    console.warn("onoff module not available, GPIO functionality will be mocked");
    return null;
  }
}
var GPIOButtonHelper = class {
  constructor(options) {
    this.gpio = null;
    this.isPressed = false;
    this.debounceTimer = null;
    this.options = {
      edge: "both",
      activeLow: false,
      debounceTimeout: 50,
      ...options
    };
    this.initializeGPIO();
  }
  async initializeGPIO() {
    try {
      if (!Gpio) {
        Gpio = await loadGpio();
      }
      if (!Gpio || !Gpio.accessible) {
        console.warn("GPIO not accessible. Running in mock mode.");
        return;
      }
      this.gpio = new Gpio(this.options.pin, "in", this.options.edge, {
        activeLow: this.options.activeLow || false
      });
      this.gpio.watch((err, value) => {
        if (err) {
          console.error("GPIO watch error:", err);
          return;
        }
        this.handleButtonChange(value);
      });
      this.isPressed = this.gpio.readSync() === 1;
    } catch (error) {
      console.error("Failed to initialize GPIO:", error);
      console.warn("Falling back to mock mode");
    }
  }
  handleButtonChange(value) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      const wasPressed = this.isPressed;
      this.isPressed = value === 1;
      if (wasPressed !== this.isPressed) {
        console.log(`GPIO Pin ${this.options.pin}: ${this.isPressed ? "PRESSED" : "RELEASED"}`);
      }
    }, this.options.debounceTimeout);
  }
  getState() {
    if (this.gpio && Gpio && Gpio.accessible) {
      try {
        return this.gpio.readSync() === 1;
      } catch (error) {
        console.error("Error reading GPIO state:", error);
        return this.isPressed;
      }
    }
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
};
function createGPIOButtonTrigger(pin, options) {
  const buttonHelper = new GPIOButtonHelper({ pin, ...options });
  process.on("SIGINT", () => buttonHelper.cleanup());
  process.on("SIGTERM", () => buttonHelper.cleanup());
  return () => buttonHelper.isButtonPressed();
}
function gpioButton(pin, activeLow = false) {
  return createGPIOButtonTrigger(pin, { activeLow });
}

exports.GPIOButtonHelper = GPIOButtonHelper;
exports.createGPIOButtonTrigger = createGPIOButtonTrigger;
exports.gpioButton = gpioButton;
//# sourceMappingURL=platform_gpio_helper.cjs.map
//# sourceMappingURL=platform_gpio_helper.cjs.map