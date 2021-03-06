"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const requestPromise = require("request-promise");
exports.request = requestPromise;
function setup(config) {
    if (config.requestOptions) {
        exports.request = requestPromise.defaults(config.requestOptions);
    }
}
exports.setup = setup;
//# sourceMappingURL=config.js.map