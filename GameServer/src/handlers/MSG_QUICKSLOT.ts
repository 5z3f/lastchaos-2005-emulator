import Message from "@local/shared/message";
import Session from "@local/shared/session";
import { SendersType } from "../senders";
import { QUICKSLOT_MAXSLOT, QUICKSLOT_PAGE_NUM, QuickSlotType } from "../system/core/quickslot";

export enum QuickSlotMessageType {
    List,
    Add,
    Swap,
}

export default async function (session: Session<SendersType>, msg: Message) {
    const subTypeMap = {
        1: 'MSG_QUICKSLOT_ADD',
        2: 'MSG_QUICKSLOT_SWAP',
        // TODO: 
    };

    const subType = msg.read('u8');
    console.log('quickslot subtype', subType);

    const subTypeHandler = {
        MSG_QUICKSLOT_ADD: () => {
            const data = {
                pageId: msg.read('u8'),
                slotId: msg.read('u8'),
                slotType: msg.read('u8'),
            }

            if (data.slotType === 255)
                data.slotType = QuickSlotType.Empty;

            if (data.pageId < 0 || data.pageId >= QUICKSLOT_PAGE_NUM || data.slotId < 0 || data.slotId >= QUICKSLOT_MAXSLOT) {
                // TODO: log it, packet malformed
                return;
            }

            const character = session.character!;

            // IMPORTANT: Check if the moved inventory item is pinned to the quickslot.
            // If it is, send the new slot row and column to prevent crashes.
            // TODO: Implement logic to handle pinned quickslot items.

            switch (data.slotType) {
                case QuickSlotType.Empty:
                    character.quickslot.remove({
                        pageId: data.pageId,
                        slotId: data.slotId
                    });
                    break;
                case QuickSlotType.Skill:
                case QuickSlotType.Action:
                    const id = msg.read('i32>');

                    character.quickslot.add({
                        pageId: data.pageId,
                        slotId: data.slotId,
                        slotType: data.slotType,
                        value1: id
                    });
                    break;
                case QuickSlotType.Item:
                    const row = msg.read('u8');
                    const col = msg.read('u8');

                    character.quickslot.add({
                        pageId: data.pageId,
                        slotId: data.slotId,
                        slotType: data.slotType,
                        value1: row,
                        value2: col
                    });
                    break;
            }

            console.log('msgquickslotadd', data);
        },
        MSG_QUICKSLOT_SWAP: () => {
            const data = {
                pageId: msg.read('u8'),
                slotIdFrom: msg.read('u8'),
                slotIdTo: msg.read('u8')
            }

            if (data.pageId < 0 || data.pageId >= QUICKSLOT_PAGE_NUM || data.slotIdFrom < 0 || data.slotIdFrom >= QUICKSLOT_MAXSLOT || data.slotIdTo < 0 || data.slotIdTo >= QUICKSLOT_MAXSLOT) {
                // TODO: log it, packet malformed
                return;
            }

            const character = session.character!;

            character.quickslot.swap({
                pageId: data.pageId,
                slotIdFrom: data.slotIdFrom,
                slotIdTo: data.slotIdTo
            });
        }
    }

    const subType1 = subTypeMap[subType as keyof typeof subTypeMap];
    if (subType1 in subTypeHandler)
        subTypeHandler[subType1 as keyof typeof subTypeHandler]();
}
