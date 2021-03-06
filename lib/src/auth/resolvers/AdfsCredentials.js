"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const config_1 = require("./../../config");
const url = require("url");
const _ = require("lodash");
const cookie = require("cookie");
let xmldoc = require('xmldoc');
const Cache_1 = require("./../../utils/Cache");
const consts = require("./../../Consts");
const AdfsHelper_1 = require("./../../utils/AdfsHelper");
const AdfsSamlToken_1 = require("./../../templates/AdfsSamlToken");
class AdfsCredentials {
    constructor(_siteUrl, _authOptions) {
        this._siteUrl = _siteUrl;
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
        if (this._authOptions.domain !== undefined) {
            this._authOptions.username = `${this._authOptions.domain}\\${this._authOptions.username}`;
        }
    }
    getAuth() {
        let siteUrlParsed = url.parse(this._siteUrl);
        let cacheKey = `${siteUrlParsed.host}@${this._authOptions.username}@${this._authOptions.password}`;
        let cachedCookie = AdfsCredentials.CookieCache.get(cacheKey);
        if (cachedCookie) {
            return Promise.resolve({
                headers: {
                    'Cookie': cachedCookie
                }
            });
        }
        return AdfsHelper_1.AdfsHelper.getSamlAssertion(this._siteUrl, this._authOptions)
            .then(data => {
            return this.postTokenData(data);
        })
            .then(data => {
            let adfsCookie = this._authOptions.adfsCookie || consts.FedAuth;
            let notAfter = new Date(data[0]).getTime();
            let expiresIn = parseInt(((notAfter - new Date().getTime()) / 1000).toString(), 10);
            let response = data[1];
            let authCookie = adfsCookie + '=' +
                response.headers['set-cookie']
                    .map((cookieString) => cookie.parse(cookieString)[adfsCookie])
                    .filter((cookieString) => typeof cookieString !== 'undefined')[0];
            AdfsCredentials.CookieCache.set(cacheKey, authCookie, expiresIn);
            return {
                headers: {
                    'Cookie': authCookie
                }
            };
        });
    }
    postTokenData(samlAssertion) {
        let result = _.template(AdfsSamlToken_1.template)({
            created: samlAssertion.notBefore,
            expires: samlAssertion.notAfter,
            relyingParty: this._authOptions.relyingParty,
            token: samlAssertion.value
        });
        let tokenXmlDoc = new xmldoc.XmlDocument(result);
        let siteUrlParsed = url.parse(this._siteUrl);
        let rootSiteUrl = `${siteUrlParsed.protocol}//${siteUrlParsed.host}`;
        return Promise.all([samlAssertion.notAfter, config_1.request.post(`${rootSiteUrl}/_trust/`, {
                form: {
                    'wa': 'wsignin1.0',
                    'wctx': `${rootSiteUrl}/_layouts/Authenticate.aspx?Source=%2F`,
                    'wresult': tokenXmlDoc.toString({ compressed: true })
                },
                resolveWithFullResponse: true,
                simple: false,
                strictSSL: false
            })]);
    }
}
AdfsCredentials.CookieCache = new Cache_1.Cache();
exports.AdfsCredentials = AdfsCredentials;
//# sourceMappingURL=AdfsCredentials.js.map