"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const OnlineResolver_1 = require("./base/OnlineResolver");
const HostingEnvironment_1 = require("../HostingEnvironment");
class OnlineAppCert extends OnlineResolver_1.OnlineResolver {
    constructor(_siteUrl, _authOptions) {
        super(_siteUrl);
        this._authOptions = _authOptions;
    }
    getAuth() {
        let cachedToken = this._authOptions.token;
        if (cachedToken) {
            return Promise.resolve({
                headers: {
                    'Authorization': `Bearer ${cachedToken}`
                }
            });
        }
    }
    InitEndpointsMappings() {
        this.endpointsMappings.set(HostingEnvironment_1.HostingEnvironment.Production, 'accounts.accesscontrol.windows.net');
        this.endpointsMappings.set(HostingEnvironment_1.HostingEnvironment.China, 'accounts.accesscontrol.chinacloudapi.cn');
        this.endpointsMappings.set(HostingEnvironment_1.HostingEnvironment.German, 'login.microsoftonline.de');
        this.endpointsMappings.set(HostingEnvironment_1.HostingEnvironment.USDefence, 'accounts.accesscontrol.windows.net');
        this.endpointsMappings.set(HostingEnvironment_1.HostingEnvironment.USGovernment, 'accounts.accesscontrol.windows.net');
    }
}
exports.OnlineAppCert = OnlineAppCert;
//# sourceMappingURL=OnlineAppCert.js.map