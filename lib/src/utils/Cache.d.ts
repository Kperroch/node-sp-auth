export declare class Cache {
    private _cache;
    set(key: string, data: any, expiration?: number | Date): void;
    get<T>(key: string): T;
    remove(key: string): void;
    clear(): void;
    private getHashKey;
}
