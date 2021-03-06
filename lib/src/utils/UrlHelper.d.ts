import { HostingEnvironment } from '../auth/HostingEnvironment';
export declare class UrlHelper {
    static removeTrailingSlash(url: string): string;
    static removeLeadingSlash(url: string): string;
    static trimSlashes(url: string): string;
    static ResolveHostingEnvironment(siteUrl: string): HostingEnvironment;
}
