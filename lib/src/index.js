"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const AuthResolverFactory_1 = require("./auth/AuthResolverFactory");
function getAuth(url, options) {
    return AuthResolverFactory_1.AuthResolverFactory.resolve(url, options).getAuth();
}
exports.getAuth = getAuth;
__export(require("./auth/IAuthOptions"));
__export(require("./utils/TokenHelper"));
var config_1 = require("./config");
exports.setup = config_1.setup;
//# sourceMappingURL=index.js.map