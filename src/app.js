"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
var config = __importStar(require("./config"));
var server_1 = __importDefault(require("./server"));
var grpc_1 = __importDefault(require("grpc"));
var path_1 = __importDefault(require("path"));
var logger_1 = __importDefault(require("./logger"));
var watcher_1 = __importDefault(require("./scripts/server/watcher"));
var watcher_2 = __importDefault(require("./scripts/deps/watcher"));
var service_1 = __importDefault(require("./scripts/server/service"));
var grpc_2 = __importDefault(require("./scripts/server/grpc"));
var install_1 = require("./scripts/deps/install");
var protoLoader = require('@grpc/proto-loader');
/**
 * Path to user-scripts
 *
 * @todo make configurable
 */
var baseScriptsDir = path_1.default.join(__dirname, '../usr');
/**
 * Path to node_modules dir (for user-script dep. installer)
 *
 * @todo make configurable
 */
var npmDownloadDir = path_1.default.join(__dirname, '../node_modules');
/**
 * Path to user-script package.json (list of dependencies)
 *
 * @todo make configurable
 */
var packageJSON = path_1.default.join(baseScriptsDir, 'package.json');
/**
 * Path to server-side user-scripts
 *
 * @todo make configurable
 */
var serverScriptsDir = path_1.default.join(baseScriptsDir, "src/server");
/**
 * Assume dependencies are installed
 *
 * @todo make configurable
 */
var assumeInstalledDependencies = true;
/**
 *
 * Main Corredor responsibilities
 *
 *  1. @todo load remote (git-repo) scripts (if not local)
 *  2. watch and reload dependencies (if src/package.json exists)
 *  3. @todo watch frontend-script changes, run tests (if any) and (re)bundle scripts
 *  4. watching backend-script changes and (re)link them to gRPC service
 *     @todo run tests?
 *  5. start gRPC server
 *
 * Misc:
 *   - secret management
 */
logger_1.default.debug('loading protobuf');
var base = path_1.default.join(config.protobuf.path, '/service-corredor-v2020.3.proto');
var def = protoLoader.loadSync(base, {});
var corredor = grpc_1.default.loadPackageDefinition(def).corredor;
logger_1.default.debug('initializing server-scripts service');
var serverScriptsService = new service_1.default(serverScriptsDir);
function installDependencies() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            logger_1.default.info('installing dependencies', packageJSON);
            return [2 /*return*/, install_1.Install(packageJSON, npmDownloadDir)];
        });
    });
}
function reloadServerScripts() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // Reload scripts every-time packages change!
            logger_1.default.info('reloading server scripts');
            return [2 /*return*/, serverScriptsService.Load().then(function () {
                    logger_1.default.info('server scripts reloaded', { count: serverScriptsService.List().length });
                })];
        });
    });
}
/**
 * App entry point
 */
(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!!assumeInstalledDependencies) return [3 /*break*/, 2];
                return [4 /*yield*/, installDependencies()];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2: return [2 /*return*/, reloadServerScripts()];
        }
    });
}); })().then(function () {
    /**
     * Setup dependency watcher that installs dependencies on
     * change & reloads server-scripts
     */
    return watcher_2.default(packageJSON, function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, installDependencies()];
                case 1:
                    _a.sent();
                    // Reload scripts every-time packages change!
                    return [2 /*return*/, reloadServerScripts()];
            }
        });
    }); });
}).then(function () {
    /**
     * Setup server-script watcher that will reload server-side scripts
     */
    return watcher_1.default(serverScriptsService.path, reloadServerScripts);
}).then(function () {
    /**
     * Start gRPC server
     */
    logger_1.default.debug('starting gRPC server');
    server_1.default(config.server, function (server) {
        server.addService(
        // Bind server-scripts handler, service & logger
        corredor.ServerScripts.service, grpc_2.default(serverScriptsService, logger_1.default.child({ system: 'gRPC', service: 'server-scripts' })));
    });
});
