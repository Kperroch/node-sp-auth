"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const url = require("url");
const _ = require("lodash");
const config_1 = require("./../../config");
const cookie = require("cookie");
let xmldoc = require('xmldoc');
const Cache_1 = require("./../../utils/Cache");
const consts = require("./../../Consts");
const AdfsHelper_1 = require("./../../utils/AdfsHelper");
const OnlineSamlWsfedAdfs_1 = require("./../../templates/OnlineSamlWsfedAdfs");
const OnlineSamlWsfed_1 = require("./../../templates/OnlineSamlWsfed");
const HostingEnvironment_1 = require("../HostingEnvironment");
const OnlineResolver_1 = require("./base/OnlineResolver");
class OnlineUserCredentials extends OnlineResolver_1.OnlineResolver {
    constructor(_siteUrl, _authOptions) {
        super(_siteUrl);
        this._authOptions = _authOptions;
        this._authOptions = _.extend({}, _authOptions);
        this._authOptions.username = this._authOptions.username
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        this._authOptions.password = this._authOptions.password
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
    getAuth() {
        let parsedUrl = url.parse(this._siteUrl);
        let host = parsedUrl.host;
        let cacheKey = `${host}@${this._authOptions.username}@${this._authOptions.password}`;
        let cachedCookie = OnlineUserCredentials.CookieCache.get(cacheKey);
        if (cachedCookie) {
            return Promise.resolve({
                headers: {
                    'Cookie': cachedCookie
                }
            });
        }
        return this.getSecurityToken()
            .then(xmlResponse => {
            return this.postToken(xmlResponse);
        })
            .then(data => {
            let response = data[1];
            let diffSeconds = data[0];
            let fedAuth;
            let rtFa;
            for (let i = 0; i < response.headers['set-cookie'].length; i++) {
                let headerCookie = response.headers['set-cookie'][i];
                if (headerCookie.indexOf(consts.FedAuth) !== -1) {
                    fedAuth = cookie.parse(headerCookie)[consts.FedAuth];
                }
                if (headerCookie.indexOf(consts.RtFa) !== -1) {
                    rtFa = cookie.parse(headerCookie)[consts.RtFa];
                }
            }
            let authCookie = 'FedAuth=' + fedAuth + '; rtFa=' + rtFa;
            OnlineUserCredentials.CookieCache.set(cacheKey, authCookie, diffSeconds);
            return {
                headers: {
                    'Cookie': authCookie
                }
            };
        });
    }
    InitEndpointsMappings() {
        this.endpointsMappings.set(HostingEnvironment_1.HostingEnvironment.Production, 'login.microsoftonline.com');
        this.endpointsMappings.set(HostingEnvironment_1.HostingEnvironment.China, 'login.chinacloudapi.cn');
        this.endpointsMappings.set(HostingEnvironment_1.HostingEnvironment.German, 'login.microsoftonline.de');
        this.endpointsMappings.set(HostingEnvironment_1.HostingEnvironment.USDefence, 'login-us.microsoftonline.com');
        this.endpointsMappings.set(HostingEnvironment_1.HostingEnvironment.USGovernment, 'login-us.microsoftonline.com');
    }
    getSecurityToken() {
        return config_1.request.post(this.OnlineUserRealmEndpoint, {
            simple: false,
            strictSSL: false,
            json: true,
            form: {
                'login': this._authOptions.username
            }
        })
            .then(userRealm => {
            let authType = userRealm.NameSpaceType;
            if (!authType) {
                throw new Error('Unable to define namespace type for Online authentiation');
            }
            if (authType === 'Managed') {
                return this.getSecurityTokenWithOnline();
            }
            if (authType === 'Federated') {
                return this.getSecurityTokenWithAdfs(userRealm.AuthURL);
            }
            throw new Error(`Unable to resolve namespace authentiation type. Type received: ${authType}`);
        });
    }
    getSecurityTokenWithAdfs(adfsUrl) {
        return AdfsHelper_1.AdfsHelper.getSamlAssertion(this._siteUrl, {
            username: this._authOptions.username,
            password: this._authOptions.password,
            adfsUrl: adfsUrl,
            relyingParty: consts.AdfsOnlineRealm
        })
            .then(samlAssertion => {
            let siteUrlParsed = url.parse(this._siteUrl);
            let rootSiteUrl = siteUrlParsed.protocol + '//' + siteUrlParsed.host;
            let tokenRequest = _.template(OnlineSamlWsfedAdfs_1.template)({
                endpoint: rootSiteUrl,
                token: samlAssertion.value
            });
            return config_1.request.post(this.MSOnlineSts, {
                body: tokenRequest,
                headers: {
                    'Content-Length': tokenRequest.length,
                    'Content-Type': 'application/soap+xml; charset=utf-8'
                },
                simple: false,
                strictSSL: false
            });
        });
    }
    getSecurityTokenWithOnline() {
        let parsedUrl = url.parse(this._siteUrl);
        let host = parsedUrl.host;
        let spFormsEndPoint = `${parsedUrl.protocol}//${host}/${consts.FormsPath}`;
        let samlBody = _.template(OnlineSamlWsfed_1.template)({
            username: this._authOptions.username,
            password: this._authOptions.password,
            endpoint: spFormsEndPoint
        });
        return config_1.request
            .post(this.MSOnlineSts, {
            body: samlBody,
            simple: false,
            strictSSL: false,
            headers: {
                'Content-Type': 'application/soap+xml; charset=utf-8'
            }
        })
            .then(xmlResponse => {
            return xmlResponse;
        });
    }
    postToken(xmlResponse) {
        let xmlDoc = new xmldoc.XmlDocument(xmlResponse);
        let parsedUrl = url.parse(this._siteUrl);
        let spFormsEndPoint = `${parsedUrl.protocol}//${parsedUrl.host}/${consts.FormsPath}`;
        let securityTokenResponse = xmlDoc.childNamed('S:Body').firstChild;
        if (securityTokenResponse.name.indexOf('Fault') !== -1) {
            throw new Error(securityTokenResponse.toString());
        }
        let binaryToken = securityTokenResponse.childNamed('wst:RequestedSecurityToken').firstChild.val;
        let now = new Date().getTime();
        let expires = new Date(securityTokenResponse.childNamed('wst:Lifetime').childNamed('wsu:Expires').val).getTime();
        let diff = (expires - now) / 1000;
        let diffSeconds = parseInt(diff.toString(), 10);
        return Promise.all([diffSeconds, config_1.request
                .post(spFormsEndPoint, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Win64; x64; Trident/5.0)',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: binaryToken,
                rejectUnauthorized: false,
                resolveWithFullResponse: true,
                simple: false
            })]);
    }
    get MSOnlineSts() {
        return `https://${this.endpointsMappings.get(this.hostingEnvironment)}/extSTS.srf`;
    }
    get OnlineUserRealmEndpoint() {
        return `https://${this.endpointsMappings.get(this.hostingEnvironment)}/GetUserRealm.srf`;
    }
}
OnlineUserCredentials.CookieCache = new Cache_1.Cache();
exports.OnlineUserCredentials = OnlineUserCredentials;
//# sourceMappingURL=OnlineUserCredentials.js.map