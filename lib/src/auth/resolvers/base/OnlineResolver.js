"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UrlHelper_1 = require("../../../utils/UrlHelper");
class OnlineResolver {
    constructor(_siteUrl) {
        this._siteUrl = _siteUrl;
        this.endpointsMappings = new Map();
        this.hostingEnvironment = UrlHelper_1.UrlHelper.ResolveHostingEnvironment(this._siteUrl);
        this.InitEndpointsMappings();
    }
}
exports.OnlineResolver = OnlineResolver;
//# sourceMappingURL=OnlineResolver.js.map