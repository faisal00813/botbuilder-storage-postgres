"use strict";
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresStorage = exports.PostgresStorageError = void 0;
const sequelize_1 = require("sequelize");
class PostgresStoreItem extends sequelize_1.Model {
}
class PostgresStorageError extends Error {
}
exports.PostgresStorageError = PostgresStorageError;
PostgresStorageError.NO_CONFIG_ERROR = new PostgresStorageError("PostgresStorageConfig is required.");
PostgresStorageError.NO_URI_ERROR = new PostgresStorageError("PostgresStorageConfig.uri is required.");
class PostgresStorage {
    constructor(config) {
        this.config = PostgresStorage.ensureConfig(Object.assign({}, config));
    }
    static ensureConfig(config) {
        if (!config) {
            throw PostgresStorageError.NO_CONFIG_ERROR;
        }
        if (!config.uri || config.uri.trim() === "") {
            throw PostgresStorageError.NO_URI_ERROR;
        }
        if (!config.collection || config.collection.trim() == "") {
            config.collection = PostgresStorage.DEFAULT_COLLECTION_NAME;
        }
        return config;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            const sequelize = new sequelize_1.Sequelize(this.config.uri, {
                // ...options
                dialect: "postgres",
                pool: {
                    max: 10,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                },
                logging: this.config.logging
            });
            yield PostgresStoreItem.init({
                id: {
                    type: sequelize_1.DataTypes.STRING,
                    primaryKey: true
                },
                data: {
                    type: sequelize_1.DataTypes.JSONB,
                    allowNull: false
                }
            }, { sequelize, tableName: this.config.collection, timestamps: false });
            yield PostgresStoreItem.sync();
            this.connection = sequelize;
            return this.connection;
        });
    }
    ensureConnected() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.connection) {
                yield this.connect();
            }
            return this.connection;
        });
    }
    read(stateKeys) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!stateKeys || stateKeys.length == 0) {
                return {};
            }
            yield this.ensureConnected();
            const items = yield PostgresStoreItem.findAll({
                where: { id: { [sequelize_1.Op.in]: stateKeys } }
            });
            return yield items.reduce((accum, item) => {
                accum[item.id] = item.data;
                return accum;
            }, {});
        });
    }
    write(changes) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!changes || Object.keys(changes).length === 0) {
                return;
            }
            yield this.ensureConnected();
            function asyncForEach(array, callback) {
                return __awaiter(this, void 0, void 0, function* () {
                    for (let index = 0; index < array.length; index++) {
                        yield callback(array[index], index, array);
                    }
                });
            }
            const writeAsync = () => __awaiter(this, void 0, void 0, function* () {
                yield asyncForEach(Object.keys(changes), (key) => __awaiter(this, void 0, void 0, function* () {
                    const query = `INSERT INTO ${PostgresStoreItem.tableName} (id, data) 
        VALUES (:id, :data) 
        ON CONFLICT (id) DO UPDATE SET data = ${PostgresStoreItem.tableName}.data || :data`;
                    yield this.connection.query(query, {
                        replacements: {
                            id: key,
                            data: JSON.stringify(changes[key])
                        }
                    });
                }));
            });
            writeAsync();
        });
    }
    delete(keys) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!keys || keys.length == 0) {
                return;
            }
            yield this.ensureConnected();
            yield PostgresStoreItem.destroy({ where: { id: { [sequelize_1.Op.in]: keys } } });
        });
    }
    //   public static shouldSlam(etag: string): boolean {
    //     return etag === "*" || !etag;
    //   }
    static randHex(n) {
        if (n <= 0) {
            return null;
        }
        let rs;
        try {
            rs = Math.ceil(n / 2);
            /* note: could do this non-blocking, but still might fail */
        }
        catch (ex) {
            rs += Math.random();
        }
        return rs;
    }
    //   public static createFilter(key: string, etag: any): object {
    //     if (this.shouldSlam(etag)) {
    //       return { id: key };
    //     }
    //     return { id: key, "state.eTag": etag };
    //   }
    get Sequelize() {
        return this.connection;
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.connection) {
                yield this.connection.close();
                delete this.connection;
            }
        });
    }
}
exports.PostgresStorage = PostgresStorage;
PostgresStorage.DEFAULT_COLLECTION_NAME = `state`;
//# sourceMappingURL=PostgresStorage.js.map