import log from "@local/shared/logger";
import type { UpsertResult } from "mariadb";
import { ItemPlaceType, ItemWearingPosition } from "../api/item";
import app from "../app";

export default class Inventory {
    /**
     * Adds an item to the inventory.
     * @param itemUid - The unique identifier of the item.
     * @param accountId - The account ID.
     * @param charId - The character ID.
     * @param position - The position of the item. (tab,col,row)
     * @returns A boolean indicating whether the item was successfully added.
     */
    static async add(itemUid: number, accountId: number, charId: number, position: string) {
        const newInventoryItemQuery = `
            UPDATE items
            SET accountId = ?, charId = ?, place = ?, position = ?
            WHERE id = ? OR parentId = ?`;

        try {
            const result: UpsertResult = await app.dbc.query(newInventoryItemQuery, [
                accountId,
                charId,
                ItemPlaceType.Inventory,
                position,
                itemUid,
                itemUid
            ]);

            return result.affectedRows > 0;
        }
        catch (error) {
            log.error(error);
            return null;
        }
    }

    static async move(itemUid: number, position: string) {
        const moveInventoryItemQuery = `
            UPDATE items
            SET position = ?
            WHERE id = ? OR parentId = ?`;

        try {
            const result: UpsertResult = await app.dbc.query(moveInventoryItemQuery, [
                position,
                itemUid,
                itemUid
            ]);

            return result.affectedRows > 0;
        }
        catch (error) {
            log.error(error);
            return null;
        }
    }

    static async equip(itemUid: number, charId: number, wearingPosition: ItemWearingPosition) {
        const equipInventoryItemQuery = `
            UPDATE items
            SET wearingPosition = ?
            WHERE charId = ? AND id = ?`;

        try {
            const result: UpsertResult = await app.dbc.query(equipInventoryItemQuery, [
                wearingPosition,
                charId,
                itemUid
            ]);

            return result.affectedRows > 0;
        }
        catch (error) {
            log.error(error);
            return null;
        }
    }

    static async unequip(itemUid: number, charId: number) {
        const equipInventoryItemQuery = `
            UPDATE items
            SET wearingPosition = NULL
            WHERE charId = ? AND id = ?`;

        try {
            const result: UpsertResult = await app.dbc.query(equipInventoryItemQuery, [
                charId,
                itemUid
            ]);

            return result.affectedRows > 0;
        }
        catch (error) {
            log.error(error);
            return null;
        }
    }
}
