import log from '@local/shared/logger';
import Message from '@local/shared/message';
import Session from '@local/shared/session';
import game from '../game';

import { ItemMessageType, ItemWearingPosition } from '../api/item';
import { GameObjectType, PacketObjectType } from '../gameobject';
import { SendersType } from '../senders';
import { SystemMessageType } from '../senders/sys';
import { Buff } from '../system/core/buff';
import { InventoryItem, InventoryTabType } from '../system/core/inventory';
import { ZoneType } from '../world';

export default function (session: Session<SendersType>, msg: Message) {
    const subType = msg.read('u8');
    console.log('item msg sub type', subType);

    const subTypeMap = {
        0: 'MSG_ITEM_USE',
        1: 'MSG_ITEM_TAKE',
        2: 'MSG_ITEM_THROW',
        3: 'MSG_ITEM_ARRANGE',
        4: 'MSG_ITEM_DELETE',
        5: 'MSG_ITEM_WEAR',
        6: 'MSG_ITEM_SWAP',
        12: 'MSG_ITEM_BUY',
        13: 'MSG_ITEM_SELL',
        14: 'MSG_ITEM_UPGRADE_REQ',
        16: 'MSG_ITEM_REFINE_REQ',
        18: 'MSG_ITEM_OPTION_ADD_REQ',
        20: 'MSG_ITEM_OPTION_DEL_REQ',
        22: 'MSG_ITEM_PROCESS_REQ',
        24: 'MSG_ITEM_MAKE_REQ',
        26: 'MSG_ITEM_MIX_REQ',
        // TODO: add more types
    };

    const subTypeHandler = {
        MSG_ITEM_USE: () => {
            const msgdata = {
                tab: msg.read('u8'),
                row: msg.read('u8'),
                col: msg.read('u8'),
                itemUid: msg.read('i32>'),
                unk: msg.read('i32>'),
            };

            const character = session.character!;

            // find base item with given itemUid
            const inventoryItem = character.inventory.find(msgdata.tab, (item) => item?.itemUid === msgdata.itemUid);

            if (!inventoryItem) {
                // TODO: error handling
                return;
            }

            // create buff from an item (baseItem.value[0], baseItem.value[1])
            const buff = Buff.fromItem(character, inventoryItem.baseItem);
            if (!buff)
                return;

            character.buffs.add(buff);
        },
        MSG_ITEM_TAKE: async () => {
            const msgdata = {
                objType: msg.read('u8'),
                objUid: msg.read('i32>'),
                itemUid: msg.read('i32>'),
            };

            const character = session.character!;

            // TODO: only character pickup is supported for now
            if (msgdata.objType != PacketObjectType.Character)
                return;

            // TODO: packet is probably malformed, log this in future
            if (msgdata.objUid != character.uid)
                return;

            // find ground item
            const found = game.world.find(GameObjectType.Item, (i) => i.uid == msgdata.itemUid && i.charUid == character.uid);

            // create inventory row
            const invenItem = new InventoryItem({
                itemUid: found.uid,
                baseItem: found.baseItem,
                plus: found.plus,
                stack: found.stack,
            });

            // add row to inventory
            const rowPosition = await character.inventory.add(InventoryTabType.Normal, invenItem);

            // TODO: error handling
            if (!rowPosition)
                return;

            // remove item from groud items queue
            game.world.remove(GameObjectType.Item, ZoneType.Juno, (i) => i.uid == found.uid);

            // send item take message
            session.send.item({
                subType: ItemMessageType.Take,
                objType: character.objType,
                objUid: character.uid,
                itemUid: found.uid
            })
        },
        MSG_ITEM_THROW: () => { },
        MSG_ITEM_ARRANGE: () => { },
        MSG_ITEM_DELETE: () => { },
        MSG_ITEM_WEAR: async () => {
            const msgdata = {
                wearingPosition: msg.read('u8'),
                item: {
                    position: {
                        tab: msg.read('u8'),
                        col: msg.read('u8'),
                        row: msg.read('u8'),
                    },
                    uid: msg.read('i32>'),
                },
            };

            const character = session.character!;
            const isTakingOff = msgdata.item.uid === -1;

            // if character tries to take an item off
            if (isTakingOff) {
                // unequip already equipped item by its wearing position and return following data: position, row data
                const result = await character.inventory.unequip(msgdata.wearingPosition);

                if (!result) {
                    session.send.sys(SystemMessageType.CannotWear);
                    return;
                }

                session.send.item({
                    subType: ItemMessageType.Wear,
                    wearingPosition: msgdata.wearingPosition,
                    src: {
                        position: { tab: 0, col: 0, row: 0 },
                        itemUid: -1
                    },
                    dst: {
                        position: result.position!,
                        itemUid: result.itemUid
                    }
                });

                return;
            }

            if (!(msgdata.wearingPosition in ItemWearingPosition)) {
                // TODO: malformed packet, better log it in the future
                session.send.sys(SystemMessageType.CannotWear);
                return;
            }

            if (msgdata.item.position.tab != InventoryTabType.Normal) {
                // TODO: malformed packet, better log it in the future
                session.send.sys(SystemMessageType.CannotWear);
                return;
            }

            // find unequipped item by its unique id
            const reqItem = character.inventory.find(msgdata.item.position.tab, (item) => item?.wearingPosition === ItemWearingPosition.None && item?.itemUid === msgdata.item.uid);

            if (!reqItem) {
                session.send.sys(SystemMessageType.CannotWear);
                return;
            }


            // unequip already equipped item by its wearing position
            // this will return null if character is trying to equip gear while being nude
            // FIXME: type needs to be fixed
            let unequippedRow: InventoryItem | false | any = await character.inventory.unequip(msgdata.wearingPosition);

            if (!unequippedRow) {
                unequippedRow = {
                    position: {
                        tab: 0,
                        col: 0,
                        row: 0
                    },
                    itemUid: -1
                }
            }

            // wear requested item
            const resp = await character.inventory.equip(reqItem.position!, msgdata.wearingPosition);

            if (!resp) {
                // TODO: send error message to the client
                return;
            }

            // character is wearing this item now so lets update its status
            session.send.item({
                subType: ItemMessageType.Wear,
                wearingPosition: msgdata.wearingPosition,
                src: {
                    position: {
                        tab: 0,
                        col: msgdata.item.position.col,
                        row: msgdata.item.position.row
                    },
                    itemUid: msgdata.item.uid
                },
                dst: {
                    position: {
                        tab: unequippedRow?.position.tab ?? 0,
                        col: unequippedRow?.position.col ?? 0,
                        row: unequippedRow?.position.row ?? 0
                    },
                    itemUid: unequippedRow?.itemUid ?? -1
                }
            });
        },
        MSG_ITEM_SWAP: () => {
            const msgdata = {
                tabId: msg.read('u8'),
                item: {
                    src: {
                        col: msg.read('u8'),
                        row: msg.read('u8'),
                        uid: msg.read('i32>'),
                    },
                    dst: {
                        col: msg.read('u8'),
                        row: msg.read('u8'),
                        uid: msg.read('i32>'),
                    },
                },
            };

            if (!(msgdata.tabId in InventoryTabType)) {
                // TODO: malformed packet, better log it in the future
                return false;
            }

            if (msgdata.item.src.row === msgdata.item.dst.row && msgdata.item.src.col === msgdata.item.dst.col) {
                // TODO: malformed packet, better log it in the future
                return false;
            }

            if (msgdata.item.src.uid === msgdata.item.dst.uid) {
                // TODO: malformed packet, better log it in the future
                return false;
            }

            const character = session.character!;

            // swap item
            character.inventory.swap(msgdata.tabId, msgdata.item.src, msgdata.item.dst);
        },
        MSG_ITEM_BUY: () => { },
        MSG_ITEM_SELL: () => { },
        MSG_ITEM_UPGRADE_REQ: () => { },
        MSG_ITEM_REFINE_REQ: () => { },
        MSG_ITEM_OPTION_ADD_REQ: () => { },
        MSG_ITEM_OPTION_DEL_REQ: () => { },
        MSG_ITEM_PROCESS_REQ: () => { },
        MSG_ITEM_MAKE_REQ: () => { },
        MSG_ITEM_MIX_REQ: () => { },
    };

    if (subTypeMap[subType] in subTypeHandler) {
        log.info(`MSG_ITEM >> ${subTypeMap[subType]}`);
        subTypeHandler[subTypeMap[subType]]();
    }
}
