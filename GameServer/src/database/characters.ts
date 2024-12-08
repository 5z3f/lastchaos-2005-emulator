import app from "../app";

import log from '@local/shared/logger';
import type { UpsertResult } from "mariadb";
import type { TableCharacters, TableItems } from "./types";

type characterCreateOptions = {
    accountId: number,
    nickname: string,
    classId: number,
    faceId: number,
    hairId: number,
};

export default class Characters {

    static async getById(id: number) {
        try {
            const [result]: TableCharacters[] = await app.dbc.query("SELECT * FROM characters WHERE id = ?", [id]);
            return result;
        }
        catch (error) {
            log.error(error);
            return null;
        }
    }

    static async getByAccountId(accountId: number) {
        try {
            const result: TableCharacters[] = await app.dbc.query("SELECT * FROM characters WHERE accountId = ?", [accountId]);
            return result;
        }
        catch (error) {
            log.error(error);
            return null;
        }
    }

    static async getInventoryItems(charId: number) {
        try {
            const result: TableItems[] = await app.dbc.query("SELECT * FROM items WHERE charId = ? AND place = 1", [charId]);
            return result;
        }
        catch (error) {
            log.error(error);
            return null;
        }
    }

    static async getWearingItems(charId: number) {
        try {
            const result: TableItems[] = await app.dbc.query("SELECT * FROM items WHERE charId = ? AND place = 1 AND wearingPosition IS NOT NULL", [charId]);
            return result;
        }
        catch (error) {
            log.error(error);
            return null;
        }
    }

    static async increaseStatistic(charId: number, statpointName: string) {
        try {
            const result: UpsertResult = await app.dbc.query(`UPDATE characters SET \`${statpointName}\` = \`${statpointName}\` + 1, statpoints = statpoints - 1 WHERE id = ?`, [
                charId
            ]);

            return result;
        }
        catch (error) {
            log.error(error);
            return null;
        }
    }

    static async exists(nickname: string) {
        try {
            const result: TableCharacters[] = await app.dbc.query("SELECT * FROM characters WHERE nickname = ?", [nickname]);
            return result;
        }
        catch (error) {
            log.error(error);
            return null;
        }
    }

    static async create({ accountId, nickname, classId, faceId, hairId }: characterCreateOptions) {
        try {
            const result: UpsertResult = await app.dbc.execute("INSERT INTO characters (accountId, nickname, class, face, hair) VALUES (?, ?, ?, ?, ?)", [
                accountId,
                nickname,
                classId,
                faceId,
                hairId
            ]);

            return result;
        }
        catch (error) {
            log.error(error);
            return null;
        }
    }
}
