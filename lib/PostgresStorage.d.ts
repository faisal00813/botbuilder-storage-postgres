/***********************************************************************************
 *
 * botbuilder-storage-postgres
 * Copyright 2019 TD Ameritrade. Released under the terms of the MIT license.
 *
 ***********************************************************************************/
import { Storage, StoreItems } from "botbuilder";
import { Sequelize } from "sequelize";
export interface PostgresStorageConfig {
    uri: string;
    collection?: string;
    logging?: boolean | ((sql: string, timing?: number) => void);
}
export declare class PostgresStorageError extends Error {
    static readonly NO_CONFIG_ERROR: PostgresStorageError;
    static readonly NO_URI_ERROR: PostgresStorageError;
}
export declare class PostgresStorage implements Storage {
    private config;
    private connection;
    static readonly DEFAULT_COLLECTION_NAME: string;
    constructor(config: PostgresStorageConfig);
    static ensureConfig(config: PostgresStorageConfig): PostgresStorageConfig;
    connect(): Promise<Sequelize>;
    ensureConnected(): Promise<Sequelize>;
    read(stateKeys: string[]): Promise<StoreItems>;
    write(changes: StoreItems): Promise<void>;
    delete(keys: string[]): Promise<void>;
    static randHex(n: number): number;
    get Sequelize(): Sequelize;
    close(): Promise<void>;
}
