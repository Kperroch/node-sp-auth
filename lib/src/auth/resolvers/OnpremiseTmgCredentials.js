"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const url = require("url");
const config_1 = require("./../../config");
const http = require("http");
const https = require("https");
const Cache_1 = require("./../../utils/Cache");
const consts = require("./../../Consts");
class OnpremiseTmgCredentials {
    constructor(_siteUrl, _authOptions) {
        this._siteUrl = _siteUrl;
        this._authOptions = _authOptions;
    }
    getAuth() {
        let parsedUrl = url.parse(this._siteUrl);
        let host = parsedUrl.host;
        let cacheKey = `${host}@${this._authOptions.username}@${this._authOptions.password}`;
        let cachedCookie = OnpremiseTmgCredentials.CookieCache.get(cacheKey);
        if (cachedCookie) {
            return Promise.resolve({
                headers: {
                    'Cookie': cachedCookie
                }
            });
        }
        let tmgEndPoint = `${parsedUrl.protocol}//${host}/${consts.TmgAuthEndpoint}`;
        let isHttps = url.parse(this._siteUrl).protocol === 'https:';
        let keepaliveAgent = isHttps ?
            new https.Agent({ keepAlive: true, rejectUnauthorized: false }) :
            new http.Agent({ keepAlive: true });
        return config_1.request({
            url: tmgEndPoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `curl=Z2F&flags=0&forcedownlevel=0&formdir=1&trusted=0&` +
                `username=${encodeURIComponent(this._authOptions.username)}&` +
                `password=${encodeURIComponent(this._authOptions.password)}`,
            agent: keepaliveAgent,
            json: false,
            simple: false,
            resolveWithFullResponse: true,
            strictSSL: false
        })
            .then((response) => {
            let authCookie = response.headers['set-cookie'][0];
            return {
                headers: {
                    'Cookie': authCookie
                }
            };
        });
    }
}
OnpremiseTmgCredentials.CookieCache = new Cache_1.Cache();
exports.OnpremiseTmgCredentials = OnpremiseTmgCredentials;
//# sourceMappingURL=OnpremiseTmgCredentials.js.map