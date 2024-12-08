import database from '../database';
import game from '../game';
import { GameObjectType } from '../gameobject';
import Character, { CharacterRole } from '../gameobject/character';
import { FailMessageType } from '../senders/fail';
import { Color } from '../system/core/chat';
import { InventoryItem, InventoryTabType } from '../system/core/inventory';

const MAX_STACK = 9999;
const GOLD_ID = 19;

/**
 * Represents the type of storage for an item.
 */
export enum ItemPlaceType {
    Ground,
    Inventory,
    Warehouse,
};

/**
 * Represents the type of item message.
 */
export enum ItemMessageType {
    Use,
    Take,
    Throw,
    Arrange,
    Delete,
    Wear,
    Swap,
    Add,
    Update,
    Drop,
    Error = 37,
};

export enum ItemWearingPosition {
    None = -1,
    Helmet,
    Shirt,
    Weapon,
    Pants,
    Shield,
    Gloves,
    Boots,
    Accessory1,
    Accessory2,
    Accessory3,
    Pet,
};


type ItemOptions = {
    owner: Character,// owner of the item to be created.
    id: number,// id of the item to be created.
    stack?: number,// number of items to be created.
    plus?: number,// plus value of the item to be created.
    seals?: {// seals of the item to be created.
        [key: string]: number
    },
    into?: string,// destination for the created item.
};

export default class ItemApi {
    /**
        Creates a new item with the given id and properties.
        
        @returns {number|boolean} - The uid of the created item or false if creation failed.
    */
    static async create({ owner, id, stack = 1, plus = 0, seals = undefined, into = 'ground' }: ItemOptions) {
        const contentItem = game.content.items.find((el) => el.id === id);

        if (!contentItem) {
            // TODO: item creation failed due to unknown base item id, send message to client
            return;
        }

        if (id === GOLD_ID) {
            // TODO: implement gold (maybe not here?)
            return;
        }

        // TODO: calling it should be simpler, like: contentItem.flags.stackable
        const isStackable = contentItem.flags.includes('COUNT');

        if (stack > 1 && !isStackable && owner.role === CharacterRole.Administrator) {
            owner.chat.system(`This item is not stackable. You can create only one item.`, Color.IndianRed);
            return;
        }

        if (stack >= 5000) {
            if (stack > MAX_STACK) {
                owner.chat.system(`Max allowed stack to create: ${MAX_STACK}`, Color.IndianRed);
                return;
            }

            owner.chat.system('Large amount, it might take some time...');
        }

        if (into === 'inventory') {
            // FIXME: what about event and quest items?
            const freeRowPosition = owner.inventory.findSpace(InventoryTabType.Normal);

            if (!freeRowPosition) {
                owner.chat.system('Not enough space in inventory.');
                return;
            }
        }

        const ownerPositionString = owner.position.clone().toArray().slice(0, 2).join(',');
        const accountId = owner.session.accountId!;

        const itemUid = await database.items.insert({
            itemId: contentItem.id,
            accountId,
            charId: owner.id,
            place: ItemPlaceType.Inventory,
            position: ownerPositionString,
            plus: plus,
            seals: seals
        });

        if (!itemUid) {
            owner.session.send.fail(FailMessageType.DatabaseFailure);
            return;
        }

        if (stack > 1) {
            const success = database.items.insertStack({
                parentId: itemUid,
                itemId: contentItem.id,
                accountId,
                charId: owner.id,
                place: 0,
                position: ownerPositionString,
                plus: plus,
                seals: seals
            }, (stack - 1));

            if (!success) {
                owner.session.send.fail(FailMessageType.DatabaseFailure);
                return;
            }
        }

        if (into === 'ground') {
            // add item to on-ground item list
            game.world.add(GameObjectType.Item, owner.zone.id, {
                uid: itemUid,
                baseItem: contentItem,
                stack: stack,
                plus: plus,
                charUid: owner.uid,
                position: owner.position.clone() // TODO: apply radius on position
            })
        }
        else if (into === 'inventory') {
            // create inventory row
            const inventoryItem = new InventoryItem({
                itemUid: itemUid,
                baseItem: contentItem,
                stack: stack,
                plus: plus
            });

            // add item to inventory
            owner.inventory.add(0, inventoryItem);
        }

        return itemUid;
    }
}
