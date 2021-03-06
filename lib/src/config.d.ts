import * as requestPromise from 'request-promise';
import { CoreOptions } from 'request';
export interface IConfiguration {
    requestOptions?: CoreOptions;
}
export declare let request: typeof requestPromise;
export declare function setup(config: IConfiguration): void;
