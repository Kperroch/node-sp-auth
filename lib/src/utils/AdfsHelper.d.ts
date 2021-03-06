import * as Promise from 'bluebird';
import { IAdfsUserCredentials } from './../auth/IAuthOptions';
import { SamlAssertion } from './SamlAssertion';
export declare class AdfsHelper {
    static getSamlAssertion(siteUrl: string, credentials: IAdfsUserCredentials): Promise<SamlAssertion>;
}
