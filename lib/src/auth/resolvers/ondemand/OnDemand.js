"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const childProcess = require("child_process");
const path = require("path");
const fs = require("fs");
const _ = require("lodash");
const cpass_1 = require("cpass");
const Cache_1 = require("./../../../utils/Cache");
const FilesHelper_1 = require("../../../utils/FilesHelper");
const IAuthOptions_1 = require("../../IAuthOptions");
class OnDemand {
    constructor(_siteUrl, _authOptions) {
        this._siteUrl = _siteUrl;
        this._authOptions = _authOptions;
        this._cpass = new cpass_1.Cpass();
        if (this._siteUrl.indexOf('/_') !== -1) {
            let indx = this._siteUrl.indexOf('/_');
            this._siteUrl = this._siteUrl.substr(0, indx);
        }
        _.defaults(this._authOptions, {
            force: false,
            persist: true
        });
    }
    getAuth() {
        let dataFilePath = this.getDataFilePath();
        let cookies;
        let cacheKey = FilesHelper_1.FilesHelper.resolveFileName(this._siteUrl);
        let cachedCookie = OnDemand.CookieCache.get(cacheKey);
        if (cachedCookie) {
            return Promise.resolve({
                headers: {
                    'Cookie': cachedCookie
                }
            });
        }
        if (!fs.existsSync(dataFilePath) || this._authOptions.force) {
            cookies = this.saveAuthData(dataFilePath);
        }
        else {
            console.log(`[node-sp-auth]: reading auth data from ${dataFilePath}`);
            cookies = JSON.parse(this._cpass.decode(fs.readFileSync(dataFilePath).toString()));
            let expired = false;
            cookies.forEach((cookie) => {
                let now = new Date();
                if (cookie.expirationDate && new Date(cookie.expirationDate * 1000) < now) {
                    expired = true;
                }
            });
            if (expired) {
                cookies = this.saveAuthData(dataFilePath);
            }
        }
        let authCookie = '';
        cookies.forEach((cookie) => {
            authCookie += `${cookie.name}=${cookie.value};`;
        });
        authCookie = authCookie.slice(0, -1);
        OnDemand.CookieCache.set(cacheKey, authCookie, this.getMaxExpiration(cookies));
        return Promise.resolve({
            headers: {
                'Cookie': authCookie
            }
        });
    }
    getMaxExpiration(cookies) {
        let expiration = 0;
        cookies.forEach(cookie => {
            if (cookie.expirationDate > expiration) {
                expiration = cookie.expirationDate * 1000;
            }
        });
        return new Date(expiration);
    }
    saveAuthData(dataPath) {
        let electronExecutable = this._authOptions.electron || 'electron';
        let isWindows = (process.platform.lastIndexOf('win') === 0);
        let options = isWindows ? { shell: true } : undefined;
        const output = childProcess.execFileSync(electronExecutable, [path.join(__dirname, 'electron/main.js'), '--', this._siteUrl, this._authOptions.force.toString()], options).toString();
        let cookieRegex = /#\{([\s\S]+?)\}#/gm;
        let cookieData = cookieRegex.exec(output);
        let cookiesJson = cookieData[1].split(';#;');
        let cookies = [];
        cookiesJson.forEach((cookie) => {
            let data = cookie.replace(/(\n|\r)+/g, '').replace(/^["]+|["]+$/g, '');
            if (data) {
                let cookieData = JSON.parse(data);
                if (cookieData.httpOnly) {
                    cookies.push(cookieData);
                    if (IAuthOptions_1.isOnPremUrl(this._siteUrl)) {
                        let expiration = new Date();
                        expiration.setMinutes(expiration.getMinutes() + (this._authOptions.ttl || 55));
                        cookieData.expirationDate = expiration.getTime() / 1000;
                    }
                    else if (!cookieData.expirationDate) {
                        let expiration = new Date();
                        expiration.setMinutes(expiration.getMinutes() + (this._authOptions.ttl || 1435));
                        cookieData.expirationDate = expiration.getTime() / 1000;
                    }
                }
            }
        });
        if (cookies.length === 0) {
            throw new Error('Cookie array is empty');
        }
        if (this._authOptions.persist) {
            fs.writeFileSync(dataPath, this._cpass.encode(JSON.stringify(cookies)));
        }
        return cookies;
    }
    getDataFilePath() {
        let userDataFolder = FilesHelper_1.FilesHelper.getUserDataFolder();
        let ondemandFolder = path.join(userDataFolder, 'ondemand');
        if (!fs.existsSync(ondemandFolder)) {
            fs.mkdirSync(ondemandFolder);
        }
        return path.join(ondemandFolder, `${FilesHelper_1.FilesHelper.resolveFileName(this._siteUrl)}.data`);
    }
}
OnDemand.CookieCache = new Cache_1.Cache();
exports.OnDemand = OnDemand;
//# sourceMappingURL=OnDemand.js.map