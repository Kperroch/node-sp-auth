"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const url = require("url");
function isOnPremUrl(siteUrl) {
    let host = (url.parse(siteUrl)).host;
    return host.indexOf('.sharepoint.com') === -1 && host.indexOf('.sharepoint.cn') === -1 && host.indexOf('.sharepoint.de') === -1
        && host.indexOf('.sharepoint-mil.us') === -1 && host.indexOf('.sharepoint.us') === -1;
}
exports.isOnPremUrl = isOnPremUrl;
function isAddinOnlyOnline(T) {
    return T.clientSecret !== undefined;
}
exports.isAddinOnlyOnline = isAddinOnlyOnline;
function isAppCertOnline(T) {
    return T.token !== undefined;
}
exports.isAppCertOnline = isAppCertOnline;
function isAddinOnlyOnpremise(T) {
    return T.shaThumbprint !== undefined;
}
exports.isAddinOnlyOnpremise = isAddinOnlyOnpremise;
function isUserCredentialsOnline(siteUrl, T) {
    if (T.online) {
        return true;
    }
    let isOnPrem = isOnPremUrl(siteUrl);
    if (!isOnPrem && T.username !== undefined && !isAdfsCredentials(T)) {
        return true;
    }
    return false;
}
exports.isUserCredentialsOnline = isUserCredentialsOnline;
function isUserCredentialsOnpremise(siteUrl, T) {
    if (T.online) {
        return false;
    }
    let isOnPrem = isOnPremUrl(siteUrl);
    if (isOnPrem && T.username !== undefined && !isAdfsCredentials(T)) {
        return true;
    }
    return false;
}
exports.isUserCredentialsOnpremise = isUserCredentialsOnpremise;
function isTmgCredentialsOnpremise(siteUrl, T) {
    let isOnPrem = isOnPremUrl(siteUrl);
    if (isOnPrem && T.username !== undefined && T.tmg) {
        return true;
    }
    return false;
}
exports.isTmgCredentialsOnpremise = isTmgCredentialsOnpremise;
function isFbaCredentialsOnpremise(siteUrl, T) {
    let isOnPrem = isOnPremUrl(siteUrl);
    if (isOnPrem && T.username !== undefined && T.fba) {
        return true;
    }
    return false;
}
exports.isFbaCredentialsOnpremise = isFbaCredentialsOnpremise;
function isAdfsCredentials(T) {
    return T.adfsUrl !== undefined;
}
exports.isAdfsCredentials = isAdfsCredentials;
function isOndemandCredentials(T) {
    return T.ondemand !== undefined;
}
exports.isOndemandCredentials = isOndemandCredentials;
//# sourceMappingURL=IAuthOptions.js.map