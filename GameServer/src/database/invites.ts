import log from "@local/shared/logger";
import type { UpsertResult } from "mariadb";
import app from "../app";
import { InviteType } from "../system/core/invite";
import type { TableInvites } from "./types";

export default class Invite {
    public static async getByType(inviteType: InviteType) {
        const query = `
            SELECT * FROM invites
            WHERE type = ? AND accepted = 0 AND resolvedAt IS NULL`;

        try {
            const result: TableInvites[] = await app.dbc.execute(query, [
                inviteType
            ]);

            return result;
        }
        catch (error) {
            log.error(error);
            return null;
        }
    }

    public static async create(inviteType: InviteType, requester: number, receiver: number) {
        const query = `
            INSERT INTO invites (type, requester, receiver)
            VALUES (?, ?, ?)`;

        try {
            const result: UpsertResult = await app.dbc.execute(query, [
                inviteType,
                requester,
                receiver
            ]);

            return Number(result.insertId);
        }
        catch (error) {
            log.error(error);
            return null;
        }
    }

    public static async resolve(id: number, accepted: number) {
        const query = `
            UPDATE invites
            SET resolvedAt = NOW(), accepted = ?
            WHERE id = ?`;

        try {
            const result: UpsertResult = await app.dbc.execute(query, [
                accepted,
                id
            ]);

            return result;
        }
        catch (error) {
            log.error(error);
            return null;
        }
    }

    public static async delete(id: number) {
        const query = `
            DELETE FROM invites
            WHERE id = ?`;

        try {
            const result = await app.dbc.execute(query, [
                id
            ]);

            return result;
        }
        catch (error) {
            log.error(error);
            return null;
        }
    }
}