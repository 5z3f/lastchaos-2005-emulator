import App from '../app';

import Message from '@local/shared/message';
import Session from '@local/shared/session';
import { SendersType } from '.';
import { ItemWearingPosition } from '../api/item';
import type { Inventory, InventoryItem } from '../system/core/inventory';
import _messages from './_messages.json';

const clientHigherThan1107 = App.config.gameserver.clientVersion > 1107;

function buildItemMessage(msg: Message, item: InventoryItem) {
    if (!item.baseItem.id) {
        msg.write('i32>', -1);                                       // item index
        return;
    }

    msg.write('i32>', item.itemUid);                                // unique index
    msg.write('i32>', item.baseItem.id);                            // item index
    msg.write('u8', item.wearingPosition == ItemWearingPosition.None ? 255 : item.wearingPosition);                          // wear position
    msg.write('i32>', item.plus);                                   // plus
    msg.write('i32>', item.flag);                                   // flag
    msg.write('i32>', item.durability);                             // durability

    if (clientHigherThan1107)
        msg.write('i32>', 0);                                       // used2

    msg.write('i64>', item.stack);                                  // count
    msg.write('u8', item.options.length);                           // option count

    for (let i = 0; i < item.options.length; i++) {
        //@ts-ignore TODO: seal types
        msg.write('u8', item.options[i]!.type);                      // option type
        //@ts-ignore TODO: seal types
        msg.write('u8', item.options[i]!.level);                     // option level
    }
}

export default function (session: Session<SendersType>) {
    return (inventory: Inventory) => {
        const rows = inventory.rows;

        // tabs
        for (let i = 0; i < rows.length; i++) {
            // columns
            for (let j = 0; j < rows[i]!.length; j++) {
                const msg = new Message({ type: _messages.MSG_INVENTORY });

                msg.write('u8', 0);       // resultArrange
                msg.write('u8', i);       // tabId
                msg.write('u8', j);       // colId

                for (let k = 0; k < rows[i]![j]!.length; k++) {
                    const item = rows[i]![j]![k]!.item;

                    if (!item) {
                        msg.write('i32>', -1);                                       // item index
                        continue;
                    }

                    buildItemMessage(msg, item);
                }

                session.write(msg.build());
            }
        }
    }
}
