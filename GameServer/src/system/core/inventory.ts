import { ItemMessageType, ItemWearingPosition } from '../../api/item';
import BaseItem from '../../baseobject/item';
import database from '../../database';
import { CharacterEvents } from '../../gameobject';
import Character from '../../gameobject/character';
import { FailMessageType } from '../../senders/fail';
import { SystemMessageType } from '../../senders/sys';

const MAX_TABS = 3;
const MAX_COLUMNS = 20;
const MAX_ROWS = 5;
const EMPTY_ROW = -1;

// TODO: weight limit should be extendable AND based on character's strength and condition
const MAX_WEIGHT = 1000;
const OVERLOAD_THRESHOLD = 1.5;

export enum InventoryTabType {
    Normal,
    Quest,
    Event,
}

type InventoryItemOptions = {
    itemUid: number,
    baseItem: BaseItem,
    stack?: number,
    stackUids?: number[],
    plus?: number,
    wearingPosition?: number,
    flag?: number,
    durability?: number,
    options?: number[]
};

export class InventoryItem {
    itemUid: number;
    baseItem: BaseItem;
    stack: number;
    stackUids: number[];
    wearingPosition: number;
    plus: number;
    flag: number;
    durability: number;
    options: number[];

    // can be undefined at the beginning
    position?: { tab: InventoryTabType, col: number, row: number };

    constructor({ itemUid, baseItem, stack, plus, wearingPosition, flag, durability, options, stackUids }: InventoryItemOptions) {
        this.itemUid = itemUid;
        this.baseItem = baseItem;
        this.stack = stack || 1;
        this.stackUids = stackUids || [];
        this.wearingPosition = wearingPosition ?? ItemWearingPosition.None;
        this.plus = plus || 0;
        this.flag = flag || 0;
        this.durability = durability || -1;
        this.options = options || [];
    }

    getWeight() {
        return this.baseItem.weight * this.stack;
    }
}


// FIXME: currently almost unused but maybe later there will be some changes
export class InventoryRow {
    item?: InventoryItem;

    constructor(item?: InventoryItem) {
        this.item = item;
    }
}


export class Inventory {
    owner: Character;
    rows: InventoryRow[][][];
    maxWeight: number;

    constructor(owner: Character) {
        this.owner = owner;
        this.rows = Array.from({ length: MAX_TABS }, () =>
            Array.from({ length: MAX_COLUMNS }, () =>
                Array.from({ length: MAX_ROWS }, () => new InventoryRow())
            )
        );

        this.maxWeight = MAX_WEIGHT;
    }

    get weight() {
        let weight = 0;

        for (let tab of this.rows) {
            for (let column of tab) {
                for (let row of column) {
                    if (row.item)
                        weight += row.item.getWeight();
                }
            }
        }

        return weight;
    }

    find(tabType: InventoryTabType, opts: (item: InventoryItem) => boolean) {
        for (let col = 0; col < MAX_COLUMNS; col++) {
            for (let row = 0; row < MAX_ROWS; row++) {
                const item = this.rows[tabType]![col]![row]!.item;
                if (item && opts(item)) {
                    item.position = {
                        tab: tabType,
                        col: col,
                        row: row
                    };

                    return item;
                }
            }
        }
    }

    filter(tabType: InventoryTabType, opts: (item: InventoryItem) => boolean) {
        const results = [];

        for (let col = 0; col < MAX_COLUMNS; col++) {
            for (let row = 0; row < MAX_ROWS; row++) {
                const item = this.rows[tabType]![col]![row]!.item;
                if (item && opts(item)) {
                    item.position = {
                        tab: tabType,
                        col: col,
                        row: row
                    };

                    results.push(item);
                }
            }
        }

        return results;
    }

    async add(tabType: InventoryTabType, inventoryItem: InventoryItem) {
        // Find a space in the default tab
        const space = this.findSpace(tabType);

        if (!space) {
            this.owner.session.send.sys(SystemMessageType.FullInventory);
            return false;
        }

        const itemWeight = inventoryItem.getWeight();

        if (this.isOverloaded(itemWeight)) {
            this.owner.session.send.sys(SystemMessageType.OverloadedWarning);
        }

        if (this.isOverloadedBeyondLimit(itemWeight)) {
            this.owner.session.send.sys(SystemMessageType.Overloaded);
            // TODO: apply speed penalty here (?)
        }

        const success = await database.inventory.add(
            inventoryItem.itemUid,
            this.owner.session.accountId!,
            this.owner.id,
            [space.tab, space.col, space.row].join(',')
        );

        if (!success) {
            this.owner.session.send.fail(FailMessageType.DatabaseFailure);
            return false;
        }

        // add the item to the found space
        inventoryItem.position = space;
        this.rows[space.tab]![space.col]![space.row]!.item = inventoryItem;

        // emit add event
        this.owner.emit(CharacterEvents.InventoryAdd, inventoryItem);

        // send item to client
        this.owner.session.send.item({
            subType: ItemMessageType.Add,
            itemUid: inventoryItem.itemUid,
            itemId: inventoryItem.baseItem.id,
            wearingPosition: (inventoryItem.wearingPosition === -1) ? 255 : inventoryItem.wearingPosition,
            plus: inventoryItem.plus,
            flag: inventoryItem.flag,
            durability: inventoryItem.durability,
            stack: inventoryItem.stack,
            position: {
                tab: space.tab,
                col: space.col,
                row: space.row
            }
            // TODO: implement item options
        });

        return true;
    }

    async swap(tabType: InventoryTabType, src: { uid: number, col: number, row: number }, dst: { uid: number, col: number, row: number }) {
        const srcItem = this.rows[tabType]![src.col]?.[src.row]?.item;
        const dstItem = this.rows[tabType]![dst.col]?.[dst.row]?.item;

        if (!srcItem) {
            // TODO: malformed packet, better log it in the future
            return false;
        }

        if ((dst.uid != EMPTY_ROW) && !dstItem) {
            // TODO: malformed packet, better log it in the future
            return false;
        }

        if (src.uid != srcItem.itemUid) {
            // TODO: malformed packet, better log it in the future
            return false;
        }

        const success = await database.inventory.move(srcItem.itemUid, [tabType, dst.col, dst.row].join(','));

        if (!success) {
            this.owner.session.send.fail(FailMessageType.DatabaseFailure);
            // TODO: log error
            return false;
        }

        if (dstItem) {
            dstItem.position = {
                tab: tabType,
                col: src.col,
                row: src.row
            };

            const success = await database.inventory.move(dstItem.itemUid, [tabType, src.col, src.row].join(','));

            if (!success) {
                this.owner.session.send.fail(FailMessageType.DatabaseFailure);
                // TODO: log error 
                return false;
            }
        }

        this.rows[tabType]![src.col]![src.row]!.item = dstItem;

        srcItem.position = {
            tab: tabType,
            col: dst.col,
            row: dst.row
        };

        // TODO: check dest position
        this.rows[tabType]![dst.col]![dst.row]!.item = srcItem;

        // emit swap event
        this.owner.emit(CharacterEvents.InventorySwap, tabType, src, dst);

        // send item to client
        this.owner.session.send.item({
            subType: ItemMessageType.Swap,
            tab: tabType,
            src: {
                position: {
                    col: src.col,
                    row: src.row
                }
            },
            dst: {
                position: {
                    col: dst.col,
                    row: dst.row
                }
            }
        });

        return true;
    }

    remove(tabType: InventoryTabType, position: { col: number, row: number }) {
        if (this.rows[tabType]![position.col]?.[position.row])
            this.rows[tabType]![position.col]![position.row]! = new InventoryRow();
    }

    async equip(position: { tab: InventoryTabType, col: number, row: number }, wearingPosition: ItemWearingPosition) {
        const rowItem = this.rows[position.tab]?.[position.col]?.[position.row];
        const reqItem = rowItem?.item;

        if (!reqItem) {
            // TODO: log error 
            return false;
        }

        const success = await database.inventory.equip(reqItem.itemUid, this.owner.id, wearingPosition);

        if (!success) {
            this.owner.session.send.fail(FailMessageType.DatabaseFailure);
            // TODO: log error 
            return false;
        }

        reqItem.wearingPosition = wearingPosition;
        this.owner.emit(CharacterEvents.InventoryEquip, reqItem);
        return reqItem;
    }

    async unequip(wearingPosition: ItemWearingPosition) {
        if (wearingPosition === ItemWearingPosition.None)
            return false;

        const reqItem = this.find(InventoryTabType.Normal, (item) => item.wearingPosition == wearingPosition);

        if (!reqItem) {
            // TODO: log error 
            return false;
        }

        const success = await database.inventory.unequip(reqItem.itemUid, this.owner.id);

        if (!success) {
            this.owner.session.send.fail(FailMessageType.DatabaseFailure);
            return false;
        }

        const rowItem = this.rows[reqItem.position!.tab]![reqItem.position!.col]![reqItem.position!.row]!;
        rowItem.item!.wearingPosition = -1;


        this.owner.emit(CharacterEvents.InventoryUnequip, reqItem);

        return reqItem;
    }

    addToPosition(inventoryItem: InventoryItem, tabType: InventoryTabType, col: number, row: number) {
        if (!this.isEmptyAt(tabType, col, row)) {
            // TODO: error
            return false;
        }

        const rowItem = this.rows[tabType]![col]![row]!;
        rowItem.item = inventoryItem;
        return true;
    }

    isEmptyAt(tabType: InventoryTabType, col: number, row: number) {
        const rowItem = this.rows[tabType]?.[col]?.[row];
        return !rowItem?.item;
    }

    isOverloaded(itemWeight: number): boolean {
        return this.weight + itemWeight > this.maxWeight;
    }

    isOverloadedBeyondLimit(itemWeight: number): boolean {
        return this.weight + itemWeight > this.maxWeight * OVERLOAD_THRESHOLD;
    }

    findSpace(tabType: InventoryTabType) {
        for (let col = 0; col < MAX_COLUMNS; col++) {
            for (let row = 0; row < MAX_ROWS; row++) {
                const rowItem = this.rows[tabType]![col]![row]!;
                if (!rowItem.item) {
                    return {
                        tab: tabType,
                        col: col,
                        row: row
                    };
                }
            }
        }
    }
}
