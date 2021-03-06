"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const url = require("url");
const config_1 = require("./../../config");
const cookie = require("cookie");
let xmldoc = require('xmldoc');
const Cache_1 = require("./../../utils/Cache");
const consts = require("./../../Consts");
const FbaLoginWsfed_1 = require("./../../templates/FbaLoginWsfed");
class OnpremiseFbaCredentials {
    constructor(_siteUrl, _authOptions) {
        this._siteUrl = _siteUrl;
        this._authOptions = _authOptions;
    }
    getAuth() {
        let parsedUrl = url.parse(this._siteUrl);
        let host = parsedUrl.host;
        let cacheKey = `${host}@${this._authOptions.username}@${this._authOptions.password}`;
        let cachedCookie = OnpremiseFbaCredentials.CookieCache.get(cacheKey);
        if (cachedCookie) {
            return Promise.resolve({
                headers: {
                    'Cookie': cachedCookie
                }
            });
        }
        let soapBody = _.template(FbaLoginWsfed_1.template)({
            username: this._authOptions.username,
            password: this._authOptions.password
        });
        let fbaEndPoint = `${parsedUrl.protocol}//${host}/${consts.FbaAuthEndpoint}`;
        return config_1.request({
            url: fbaEndPoint,
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'Content-Length': soapBody.length
            },
            body: soapBody,
            json: false,
            simple: false,
            strictSSL: false,
            transform: (body, response, resolveWithFullResponse) => {
                return response;
            }
        })
            .then((response) => {
            let xmlDoc = new xmldoc.XmlDocument(response.body);
            if (xmlDoc.name === 'm:error') {
                let errorCode = xmlDoc.childNamed('m:code').val;
                let errorMessage = xmlDoc.childNamed('m:message').val;
                throw new Error(`${errorCode}, ${errorMessage}`);
            }
            let errorCode = xmlDoc.childNamed('soap:Body').childNamed('LoginResponse').childNamed('LoginResult').childNamed('ErrorCode').val;
            let cookieName = xmlDoc.childNamed('soap:Body').childNamed('LoginResponse').childNamed('LoginResult').childNamed('CookieName').val;
            let diffSeconds = parseInt(xmlDoc.childNamed('soap:Body').childNamed('LoginResponse').childNamed('LoginResult').childNamed('TimeoutSeconds').val, null);
            let cookieValue;
            if (errorCode === 'PasswordNotMatch') {
                throw new Error(`Password doesn't not match`);
            }
            if (errorCode !== 'NoError') {
                throw new Error(errorCode);
            }
            (response.headers['set-cookie'] || []).forEach((headerCookie) => {
                if (headerCookie.indexOf(cookieName) !== -1) {
                    cookieValue = cookie.parse(headerCookie)[cookieName];
                }
            });
            let authCookie = `${cookieName}=${cookieValue}`;
            OnpremiseFbaCredentials.CookieCache.set(cacheKey, authCookie, diffSeconds);
            return {
                headers: {
                    'Cookie': authCookie
                }
            };
        });
    }
}
OnpremiseFbaCredentials.CookieCache = new Cache_1.Cache();
exports.OnpremiseFbaCredentials = OnpremiseFbaCredentials;
//# sourceMappingURL=OnpremiseFbaCredentials.js.map