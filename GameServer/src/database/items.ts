import log from '@local/shared/logger';
import type { UpsertResult } from 'mariadb';
import app from "../app";

type item = {
    itemId: number; // ID of the item to be inserted.
    accountId: number; // ID of the account to which the item belongs.
    charId: number; // ID of the character who owns the item.
    place: number; // The location where the item is placed.
    position: string; // The position of the item in the location.
    plus: number; // The plus value of the item.
    seals?: {// seals of the item to be created.
        [key: string]: number;
    };
    parentId?: number; // The ID of the parent item, if any.
}

export default class Items {

    /**
        Inserts a new virtual item into the database.
        @returns The ID of the newly inserted item, or null if there was an error.
    */
    static async insert(item: item) {
        const newItemQuery = `
            INSERT INTO items (itemId, accountId, charId, place, position, plus, seals, parentId) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        try {
            const result: UpsertResult = await app.dbc.execute(newItemQuery, [
                item.itemId,
                item.accountId,
                item.charId,
                item.place,
                item.position,
                item.plus,
                item.seals,
                item.parentId
            ]);

            return Number(result.insertId);
        }
        catch (error) {
            log.error(error);
            return null;
        }
    }

    static async insertStack(item: item, stack: number) {
        if (stack <= 0)
            return null;

        const values = [
            item.itemId,
            item.accountId,
            item.charId,
            item.place,
            `"${item.position}"`,
            item.plus ?? 'NULL',
            item.seals ?? 'NULL',
            item.parentId ?? 'NULL'
        ];

        const queryValues: string[] = [];

        for (let i = 0; i < stack; i++)
            queryValues.push(`(${values.join(',')})`);

        try {
            // TODO: probably will cause problem with max allowed packet
            const query = `INSERT INTO items (itemId, accountId, charId, place, position, plus, seals, parentId) VALUES ${queryValues.join(',')}`;
            const result: UpsertResult = await app.dbc.query(query);
            return result.insertId;
        }
        catch (error) {
            log.error(error);
            return null;
        }
    }

    static async update({ where, data }: any) {
        const k = Object.keys(data);
        const v = Object.values(data);

        const updateItemQuery = `
            UPDATE items
            SET ${k.map((key) => `${key}=?`)}
            WHERE ${Object.keys(where).map((key) => `${key}=?`).join(' AND ')}
        `;

        const result = await app.dbc.execute(updateItemQuery, [...v, ...Object.values(where)]);
        return result;
    }
}
