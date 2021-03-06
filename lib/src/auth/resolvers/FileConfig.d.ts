import * as Promise from 'bluebird';
import { IAuthResolver } from '../IAuthResolver';
import { IAuthResponse } from '../IAuthResponse';
export declare class FileConfig implements IAuthResolver {
    private _siteUrl;
    private static CredsCache;
    constructor(_siteUrl: string);
    getAuth(): Promise<IAuthResponse>;
    private findBestMatch;
}
