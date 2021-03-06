import { IAuthOptions } from './IAuthOptions';
import { IAuthResolver } from './IAuthResolver';
export declare class AuthResolverFactory {
    static resolve(siteUrl: string, options?: IAuthOptions): IAuthResolver;
}
