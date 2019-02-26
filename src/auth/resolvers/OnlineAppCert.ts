import * as Promise from 'bluebird';
import { request } from './../../config';
import { IncomingMessage } from 'http';
import * as url from 'url';

import { IOnlineAddinCredentials } from './../IAuthOptions';
import { IAuthResponse } from './../IAuthResponse';
import { Cache } from './../../utils/Cache';
import { UrlHelper } from './../../utils/UrlHelper';
import * as consts from './../../Consts';
import { OnlineResolver } from './base/OnlineResolver';
import { HostingEnvironment } from '../HostingEnvironment';

export class OnlineAppCert extends OnlineResolver {

  private static TokenCache: Cache = new Cache();

  constructor(_siteUrl: string, private _authOptions: IOnlineAddinCredentials) {
    super(_siteUrl);
  }

  public getAuth(): Promise<IAuthResponse> {
    let cachedToken: string = this._authOptions.token;

    if (cachedToken) {
      return Promise.resolve({
        headers: {
          'Authorization': `Bearer ${cachedToken}`
        }
      });
    }
  }
}
