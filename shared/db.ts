import mariadb from 'mariadb';
import log from './logger';

import dotenv from 'dotenv';
dotenv.config();

const env = process.env;

export default class db {
    static #config: string | mariadb.PoolConfig = {
        host: env.DATABASE_HOST,
        port: parseInt(env.DATABASE_PORT || '3306'),
        user: env.DATABASE_USERNAME,
        password: env.DATABASE_PASSWORD,
        database: env.DATABASE_NAME,
        connectionLimit: 50,
        //multipleStatements: true, // don't
    }

    static pool: mariadb.Pool;

    static initialize() {
        this.pool = mariadb.createPool(this.#config);
        log.info('Database connection established');
        return this.pool;
    }
}
