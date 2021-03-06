"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const fs = require("fs");
const path = require("path");
const node_sp_auth_config_1 = require("node-sp-auth-config");
const FilesHelper_1 = require("../../utils/FilesHelper");
const AuthResolverFactory_1 = require("./../AuthResolverFactory");
const Cache_1 = require("./../../utils/Cache");
class FileConfig {
    constructor(_siteUrl) {
        this._siteUrl = _siteUrl;
    }
    getAuth() {
        let fileNameTemplate = FilesHelper_1.FilesHelper.resolveFileName(this._siteUrl);
        let cachedCreds = FileConfig.CredsCache.get(fileNameTemplate);
        if (cachedCreds) {
            return AuthResolverFactory_1.AuthResolverFactory.resolve(this._siteUrl, cachedCreds).getAuth();
        }
        let userDataFolder = FilesHelper_1.FilesHelper.getUserDataFolder();
        let credsFolder = path.join(userDataFolder, 'creds');
        if (!fs.existsSync(credsFolder)) {
            fs.mkdirSync(credsFolder);
        }
        let fileNames = fs.readdirSync(credsFolder).map(name => {
            return path.basename(name, path.extname(name));
        });
        let configPath = this.findBestMatch(fileNameTemplate, fileNames);
        if (!configPath) {
            configPath = path.join(credsFolder, `${fileNameTemplate}.json`);
        }
        else {
            configPath = path.join(credsFolder, `${configPath}.json`);
            console.log(`[node-sp-auth]: reading auth data from ${configPath}`);
        }
        let config = new node_sp_auth_config_1.AuthConfig({
            configPath: configPath,
            encryptPassword: true,
            saveConfigOnDisk: true
        });
        return Promise.resolve(config.getContext())
            .then(context => {
            let fileNameTemplate = FilesHelper_1.FilesHelper.resolveFileName(context.siteUrl);
            let fileNameWithoutExt = path.basename(configPath, path.extname(configPath));
            if (fileNameWithoutExt !== fileNameTemplate) {
                let fileName = path.basename(configPath);
                let newPath = configPath.replace(fileName, `${fileNameTemplate}.json`);
                fs.renameSync(configPath, newPath);
            }
            return context.authOptions;
        })
            .then(authOptions => {
            FileConfig.CredsCache.set(fileNameTemplate, authOptions);
            return AuthResolverFactory_1.AuthResolverFactory.resolve(this._siteUrl, authOptions).getAuth();
        });
    }
    findBestMatch(fileNameTemplate, fileNames) {
        let matchLength = 2048;
        let matchFileName = null;
        fileNames.forEach(fileName => {
            if (fileNameTemplate.indexOf(fileName) !== -1) {
                let subUrlLength = fileNameTemplate.replace(fileName, '').length;
                if (subUrlLength < matchLength) {
                    matchLength = subUrlLength;
                    matchFileName = fileName;
                }
            }
        });
        return matchFileName;
    }
}
FileConfig.CredsCache = new Cache_1.Cache();
exports.FileConfig = FileConfig;
//# sourceMappingURL=FileConfig.js.map