"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const url = require("url");
const Cache_1 = require("./../../utils/Cache");
const consts = require("./../../Consts");
class OnpremiseAddinOnly {
    constructor(_siteUrl, _authOptions) {
        this._siteUrl = _siteUrl;
        this._authOptions = _authOptions;
    }
    getAuth() {
        let sharepointhostname = url.parse(this._siteUrl).host;
        let audience = `${consts.SharePointServicePrincipal}/${sharepointhostname}@${this._authOptions.realm}`;
        let fullIssuerIdentifier = `${this._authOptions.issuerId}@${this._authOptions.realm}`;
        let options = {
            key: fs.readFileSync(this._authOptions.rsaPrivateKeyPath)
        };
        let dateref = parseInt(((new Date()).getTime() / 1000).toString(), 10);
        let rs256 = {
            typ: 'JWT',
            alg: 'RS256',
            x5t: this._authOptions.shaThumbprint
        };
        let actortoken = {
            aud: audience,
            iss: fullIssuerIdentifier,
            nameid: this._authOptions.clientId + '@' + this._authOptions.realm,
            nbf: dateref - consts.HighTrustTokenLifeTime,
            exp: dateref + consts.HighTrustTokenLifeTime,
            trustedfordelegation: true
        };
        let cacheKey = actortoken.nameid;
        let cachedToken = OnpremiseAddinOnly.TokenCache.get(cacheKey);
        let accessToken;
        if (cachedToken) {
            accessToken = cachedToken;
        }
        else {
            accessToken = jwt.sign(actortoken, options.key, { header: rs256 });
            OnpremiseAddinOnly.TokenCache.set(cacheKey, accessToken, consts.HighTrustTokenLifeTime - 60);
        }
        return Promise.resolve({
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
    }
}
OnpremiseAddinOnly.TokenCache = new Cache_1.Cache();
exports.OnpremiseAddinOnly = OnpremiseAddinOnly;
//# sourceMappingURL=OnpremiseAddinOnly.js.map