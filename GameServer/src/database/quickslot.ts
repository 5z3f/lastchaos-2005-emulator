import log from "@local/shared/logger";
import type { UpsertResult } from "mariadb";
import app from "../app";
import { QUICKSLOT_MAXSLOT } from "../system/core/quickslot";
import type { TableQuickslot } from "./types";

export default class Quickslot {
    static async get(characterId: number) {
        try {
            const result: TableQuickslot[] = await app.dbc.query("SELECT * FROM quickslot WHERE id = ?", [
                characterId
            ]);

            return result;
        }
        catch (error) {
            log.error(error);
            return null;
        }
    }

    static async update(characterId: number, pageId: number, slotData: any[]) {
        try {
            const slots = Array.from({ length: QUICKSLOT_MAXSLOT }, (_, i) => `slot${i + 1} = ?`).join(', ');
            const slotDataString = slotData.map(s => s.join(','));

            const result: UpsertResult = await app.dbc.query(`UPDATE quickslot SET ${slots} WHERE id = ? AND page = ?`, [
                ...slotDataString,
                characterId,
                pageId
            ]);

            return result;
        }
        catch (error) {
            log.error(error);
            return null;
        }
    }

    static async createPage(characterId: number, pageId: number, slotData: any[]) {
        try {
            const QUICKSLOT_MAXSLOT = 10;
            const placeholders = Array.from({ length: QUICKSLOT_MAXSLOT }, () => '?').join(', ');
            const slots = Array.from({ length: QUICKSLOT_MAXSLOT }, (_, i) => `slot${i + 1}`).join(', ');
            const slotDataString = slotData.map(s => s.join(','));

            const result: UpsertResult = await app.dbc.query(`INSERT INTO quickslot (id, page, ${slots}) VALUES (?, ?, ${placeholders})`, [
                characterId,
                pageId,
                ...slotDataString
            ]);

            return result;
        }
        catch (error) {
            log.error(error);
            return null;
        }
    }
}