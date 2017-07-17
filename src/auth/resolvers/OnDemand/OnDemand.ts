import * as Promise from 'bluebird';
import * as childProcess from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'lodash';
import { Cpass } from 'cpass';
import * as url from 'url';

import { IAuthResolver } from '../../IAuthResolver';
import { IAuthResponse } from '../../IAuthResponse';
import { IOnDemandCredentials } from '../../IAuthOptions';
import { UrlHelper } from '../../../utils/UrlHelper';
import { Cache } from './../../../utils/Cache';

export interface ICookie {
  httpOnly: boolean;
  name: string;
  value: string;
  expirationDate?: number;
}

export class OnDemand implements IAuthResolver {
  private static CookieCache: Cache = new Cache();
  private static Expiration = 24 * 60 * 60;
  private _cpass = new Cpass();

  constructor(private _siteUrl: string, private _authOptions: IOnDemandCredentials) {
    _.defaults(this._authOptions, {
      force: false,
      persist: true
    });
  }

  public getAuth(): Promise<IAuthResponse> {
    let dataFilePath = this.getDataFilePath();
    let cookies: ICookie[];
    let cacheKey: string = this.resolveFileName();

    let cachedCookie: string = OnDemand.CookieCache.get<string>(cacheKey);

    if (cachedCookie) {
      return Promise.resolve({
        headers: {
          'Cookie': cachedCookie
        }
      });
    }

    if (!fs.existsSync(dataFilePath) || this._authOptions.force) {
      cookies = this.saveAuthData(dataFilePath);
    } else {
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
    OnDemand.CookieCache.set(cacheKey, authCookie, OnDemand.Expiration);

    return Promise.resolve({
      headers: {
        'Cookie': authCookie
      }
    });
  }

  private saveAuthData(dataPath: string): ICookie[] {
    let isWindows = (process.platform.lastIndexOf('win') === 0);
    let host = url.parse(this._siteUrl).hostname;
    let isOnPrem = host.indexOf('.sharepoint.com') === -1 && host.indexOf('.sharepoint.cn') === -1;
    let command = isWindows ? 'cmd.exe' : 'sh';
    let electronExecutable = this._authOptions.electron || 'electron';
    let args = `${electronExecutable} ${path.join(__dirname, 'electron/main.js')} ${this._siteUrl} ${this._authOptions.force}`;
    const output = childProcess.execFileSync(command, [isWindows ? '/c' : '-c', args]).toString();

    let cookieRegex = /#\{([\s\S]+?)\}#/gm;
    let cookieData = cookieRegex.exec(output);

    let cookiesJson = cookieData[1].split(';#;');
    let cookies: ICookie[] = [];

    cookiesJson.forEach((cookie) => {
      let data: string = cookie.replace(/(\n|\r)+/g, '').replace(/^["]+|["]+$/g, '');
      if (data) {
        let cookieData = JSON.parse(data) as ICookie;
        if (cookieData.httpOnly) {
          cookies.push(cookieData);

          // explicitly set 1 hour expiration for on-premise
          if (isOnPrem) {
            let expiration = new Date();
            expiration.setMinutes(expiration.getMinutes() + 55);
            cookieData.expirationDate = expiration.getTime();
          } else if (!cookieData.expirationDate) { // 24 hours for online if no expiration date on cookie
            let expiration = new Date();
            expiration.setMinutes(expiration.getMinutes() + 1435);
            cookieData.expirationDate = expiration.getTime();
          }
        }
      }
    });

    if (cookies.length === 0) {
      throw new Error('Cookie array is empy');
    }

    if (this._authOptions.persist) {
      fs.writeFileSync(dataPath, this._cpass.encode(JSON.stringify(cookies)));
    }

    return cookies;
  }

  private getDataFilePath(): string {
    let userDataFolder = this.getUserDataFolder();
    if (!fs.existsSync(userDataFolder)) {
      fs.mkdirSync(userDataFolder);
    }
    return path.join(userDataFolder, `${this.resolveFileName()}_ondemand.data`);
  }

  private getUserDataFolder(): string {
    let platform = process.platform;
    let homepath: string;

    if (platform.lastIndexOf('win') === 0) {
      homepath = process.env.APPDATA || process.env.LOCALAPPDATA;
    }

    if (platform === 'darwin') {
      homepath = process.env.HOME;
      homepath = path.join(homepath, 'Library', 'Preferences');
    }

    if (platform === 'linux') {
      homepath = process.env.HOME;
    }

    if (!homepath) {
      throw new Error('Couldn\'t find the base application data folder');
    }

    return path.join(homepath, 'spauth');
  }

  private resolveFileName(): string {
    let url = UrlHelper.removeTrailingSlash(this._siteUrl);
    return url.replace(/[\:/\s]/g, '_');
  }
}
