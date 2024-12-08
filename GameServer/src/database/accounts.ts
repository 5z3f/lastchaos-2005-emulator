import log from '@local/shared/logger';
import bcrypt from 'bcrypt';
import app from '../app';
import type { TableAccounts, TableCharacters } from './types';

export default class Accounts {
    static async getByCredentials(username: string, password: string) {
        try {
            const [dbAccount]: TableAccounts[] = await app.dbc.query("SELECT * FROM accounts WHERE username = ?", [username]);

            if (!dbAccount)
                return false;
            if (!dbAccount.hash)
                return false;

            const isValid = await bcrypt.compare(password, dbAccount.hash);
            if (!isValid)
                return false;

            return dbAccount;
        }
        catch (error) {
            log.error(error);
            return null;
        }
    }

    static async getCharacters(accountId: number) {
        try {
            const dbCharacters: TableCharacters[] = await app.dbc.query("SELECT * FROM characters WHERE accountId = ?", [accountId]);
            return dbCharacters;
        }
        catch (error) {
            log.error(error);
            return null;
        }
    }
}
