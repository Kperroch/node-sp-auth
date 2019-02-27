import * as Promise from 'bluebird';
import { request } from './../../config';
import { IncomingMessage } from 'http';
import * as url from 'url';

import { IOnlineAppCert } from './../IAuthOptions';
import { IAuthResponse } from './../IAuthResponse';
import { Cache } from './../../utils/Cache';
import { UrlHelper } from './../../utils/UrlHelper';
import * as consts from './../../Consts';
import { OnlineResolver } from './base/OnlineResolver';
import { HostingEnvironment } from '../HostingEnvironment';

export class OnlineAppCert extends OnlineResolver {

  private static TokenCache: Cache = new Cache();

  constructor(_siteUrl: string, private _authOptions: IOnlineAppCert) {
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
  
  protected InitEndpointsMappings(): void {
    this.endpointsMappings.set(HostingEnvironment.Production, 'accounts.accesscontrol.windows.net');
    this.endpointsMappings.set(HostingEnvironment.China, 'accounts.accesscontrol.chinacloudapi.cn');
    this.endpointsMappings.set(HostingEnvironment.German, 'login.microsoftonline.de');
    this.endpointsMappings.set(HostingEnvironment.USDefence, 'accounts.accesscontrol.windows.net');
    this.endpointsMappings.set(HostingEnvironment.USGovernment, 'accounts.accesscontrol.windows.net');
  }
}
