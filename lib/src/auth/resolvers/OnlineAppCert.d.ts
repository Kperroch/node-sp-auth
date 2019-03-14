import * as Promise from 'bluebird';
import { IOnlineAppCert } from './../IAuthOptions';
import { IAuthResponse } from './../IAuthResponse';
import { OnlineResolver } from './base/OnlineResolver';
export declare class OnlineAppCert extends OnlineResolver {
    private _authOptions;
    constructor(_siteUrl: string, _authOptions: IOnlineAppCert);
    getAuth(): Promise<IAuthResponse>;
    protected InitEndpointsMappings(): void;
}
