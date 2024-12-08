import log from "@local/shared/logger";
import type { UpsertResult } from "mariadb";
import app from "../app";

export default class Friends {
    public static async get(characterId: number) {
        const query = `
            SELECT friends.id as friendId, characters.nickname, characters.class FROM friends
            JOIN characters ON friends.id = characters.id
            WHERE friends.id2 = ?
            UNION
            SELECT friends.id2 as friendId, characters.nickname, characters.class FROM friends
            JOIN characters ON friends.id2 = characters.id
            WHERE friends.id = ?`;

        try {
            const result = await app.dbc.execute(query, [
                characterId,
                characterId
            ]);

            return result;
        }
        catch (error) {
            log.error(error);
            return null;
        }
    }

    public static async create(characterId: number, friendId: number) {
        const query = `
            INSERT INTO friends (id, id2)
            VALUES (?, ?)`;

        try {
            const result: UpsertResult = await app.dbc.execute(query, [
                characterId,
                friendId
            ]);

            return result;
        }
        catch (error) {
            log.error(error);
            return null;
        }
    }

    public static async delete(characterId: number, friendId: number) {
        const query = `
            DELETE FROM friends
            WHERE (id = ? AND id2 = ?) OR (id = ? AND id2 = ?)`;

        try {
            const result = await app.dbc.execute(query, [
                characterId,
                friendId,
                friendId,
                characterId
            ]);

            return result;
        }
        catch (error) {
            log.error(error);
            return null;
        }
    }
}
