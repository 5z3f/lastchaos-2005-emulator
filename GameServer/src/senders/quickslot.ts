import _messages from './_messages.json';

import Message from '@local/shared/message';
import Session from '@local/shared/session';

import { SendersType } from '.';
import { QUICKSLOT_MAXSLOT, QuickSlotType } from '../system/core/quickslot';

enum QuickSlotMessageType {
    List,
    Add,
    Swap,
}

function buildSlotMessage(session: Session<SendersType>, msg: Message, pageId: number, slot: number) {
    let slotType: QuickSlotType;
    let value1: number;
    let value2: number;

    const character = session.character!;
    const quickslot = character.quickslot.quickSlots[pageId]![slot]!;
    // @ts-ignore TODO: fix types
    [slotType, value1, value2] = quickslot;

    msg.write('u8', (slotType === QuickSlotType.Empty) ? 255 : slotType);

    switch (slotType) {
        case QuickSlotType.Item:
            msg.write('u8', (value1 === -1) ? 255 : value1); // row
            msg.write('u8', (value2 === -1) ? 255 : value2); // col
            break;
        case QuickSlotType.Skill:
        case QuickSlotType.Action:
            msg.write('i32>', value1); // id
            break;
    }
}

export default function (session: Session<SendersType>) {
    // TODO: types for data
    return (subType: QuickSlotMessageType, data: any) => {
        const msg = new Message({ type: _messages.MSG_QUICKSLOT, subType });
        msg.write('u8', data.pageId);

        switch (subType) {
            case QuickSlotMessageType.List:
                for (let i = 0; i < QUICKSLOT_MAXSLOT; i++)
                    buildSlotMessage(session, msg, data.pageId, i);
                break;
            case QuickSlotMessageType.Add:
                msg.write('u8', data.slotId);
                buildSlotMessage(session, msg, data.pageId, data.slotId);
                break;
        }

        session.write(msg.build());
    }
}
