"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./../config");
const url = require("url");
const _ = require("lodash");
let xmldoc = require('xmldoc');
const AdfsSamlWsfed_1 = require("./../templates/AdfsSamlWsfed");
class AdfsHelper {
    static getSamlAssertion(siteUrl, credentials) {
        let adfsHost = url.parse(credentials.adfsUrl).host;
        let usernameMixedUrl = `https://${adfsHost}/adfs/services/trust/13/usernamemixed`;
        let samlBody = _.template(AdfsSamlWsfed_1.template)({
            to: usernameMixedUrl,
            username: credentials.username,
            password: credentials.password,
            relyingParty: credentials.relyingParty
        });
        return config_1.request.post(usernameMixedUrl, {
            body: samlBody,
            strictSSL: false,
            simple: false,
            headers: {
                'Content-Length': samlBody.length,
                'Content-Type': 'application/soap+xml; charset=utf-8'
            }
        })
            .then(xmlResponse => {
            let doc = new xmldoc.XmlDocument(xmlResponse);
            let tokenResponseCollection = doc.childNamed('s:Body').firstChild;
            if (tokenResponseCollection.name.indexOf('Fault') !== -1) {
                throw new Error(tokenResponseCollection.toString());
            }
            let responseNamespace = tokenResponseCollection.name.split(':')[0];
            let securityTokenResponse = doc.childNamed('s:Body').firstChild.firstChild;
            let samlAssertion = securityTokenResponse.childNamed(responseNamespace + ':RequestedSecurityToken').firstChild;
            let notBefore = samlAssertion.firstChild.attr['NotBefore'];
            let notAfter = samlAssertion.firstChild.attr['NotOnOrAfter'];
            return {
                value: samlAssertion.toString({ compressed: true }),
                notAfter: notAfter,
                notBefore: notBefore
            };
        });
    }
}
exports.AdfsHelper = AdfsHelper;
//# sourceMappingURL=AdfsHelper.js.map