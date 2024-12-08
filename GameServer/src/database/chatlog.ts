import log from "@local/shared/logger";
import app from "../app";
import type { TableChatlog } from "./types";

export default class Chatlog {
    public static async get(chatType: number, senderId: number, receiverId: number | null = null, limit: number = 50) {
        const query = `
            SELECT * FROM chatlog
            WHERE type = ? AND sender = ? AND receiver = ?
            ORDER BY id DESC
            LIMIT ?`;

        try {
            const result: TableChatlog[] = await app.dbc.execute(query, [
                chatType,
                senderId,
                receiverId,
                limit
            ]);

            return result;
        }
        catch (error) {
            log.error(error);
            return null;
        }
    }
}
