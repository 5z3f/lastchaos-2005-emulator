import Message from '@local/shared/message';
import Session from '@local/shared/session';
import { SendersType } from '.';
import { ItemMessageType } from '../api/item';
import type { PositionProps } from '../types/position';
import _messages from './_messages.json';

type TakeMessageData = {
    subType: ItemMessageType.Take;
    objType: number;
    objUid: number;
    itemUid: number;
}

function buildTakeMessage(msg: Message, data: TakeMessageData) {
    msg.write('u8', data.objType);
    msg.write('i32>', data.objUid);
    msg.write('i32>', data.itemUid);
}

type WearMessageData = {
    subType: ItemMessageType.Wear;
    wearingPosition: number;
    src: {
        position: {
            tab: number;
            col: number;
            row: number;
        };
        itemUid: number;
    };
    dst: {
        position: {
            tab: number;
            col: number;
            row: number;
        };
        itemUid: number;
    };
}

function buildWearMessage(msg: Message, data: WearMessageData) {
    msg.write('u8', data.wearingPosition);
    msg.write('u8', data.src.position.tab);
    msg.write('u8', data.src.position.col);
    msg.write('u8', data.src.position.row);
    msg.write('i32>', data.src.itemUid);
    msg.write('u8', data.dst.position.tab);
    msg.write('u8', data.dst.position.col);
    msg.write('u8', data.dst.position.row);
    msg.write('i32>', data.dst.itemUid);
}

type SwapMessageData = {
    subType: ItemMessageType.Swap;
    tab: number;
    src: {
        position: {
            col: number;
            row: number;
        };
    };
    dst: {
        position: {
            col: number;
            row: number;
        };
    };
}

function buildSwapMessage(msg: Message, data: SwapMessageData) {
    msg.write('u8', data.tab);
    msg.write('u8', data.src.position.col);
    msg.write('u8', data.src.position.row);
    msg.write('u8', data.dst.position.col);
    msg.write('u8', data.dst.position.row);
}

type AddMessageData = {
    subType: ItemMessageType.Add;
    position: {
        tab: number;
        col: number;
        row: number;
    };
    itemUid: number;
    itemId: number;
    wearingPosition: number;
    plus: number;
    flag: number;
    durability: number;
    stack: number;
}

function buildAddMessage(msg: Message, data: AddMessageData) {
    msg.write('u8', data.position.tab);
    msg.write('u8', data.position.col);
    msg.write('u8', data.position.row);
    msg.write('i32>', data.itemUid);
    msg.write('i32>', data.itemId);
    msg.write('u8', data.wearingPosition);
    msg.write('i32>', data.plus);
    msg.write('i32>', data.flag);
    msg.write('i32>', data.durability);
    msg.write('i64>', data.stack);

    // TODO: item options
    msg.write('u8', 0);
}

type DropMessageData = {
    subType: ItemMessageType.Drop;
    itemUid: number;
    itemId: number;
    stack: number;
    position: PositionProps;
    objType: number;
    objUid: number;
    alive: number;
}

function buildDropMessage(msg: Message, data: DropMessageData) {
    msg.write('i32>', data.itemUid);
    msg.write('i32>', data.itemId);
    msg.write('i64>', data.stack);
    msg.write('f<', data.position.x);
    msg.write('f<', data.position.y);
    msg.write('f<', data.position.z);
    msg.write('f<', data.position.r);
    msg.write('u8', data.position.layer);

    msg.write('u8', data.objType);          // owner object type
    msg.write('i32>', data.objUid);         // owner object uid
    msg.write('u8', data.alive || 0);       // is owner alive?
}

type ItemMessageData = TakeMessageData | WearMessageData | SwapMessageData | AddMessageData | DropMessageData;

export default function (session: Session<SendersType>) {
    return (data: ItemMessageData) => {
        const msg = new Message({ type: _messages.MSG_ITEM, subType: data.subType });

        switch (data.subType) {
            case ItemMessageType.Take:
                buildTakeMessage(msg, data);
                break;
            case ItemMessageType.Wear:
                buildWearMessage(msg, data);
                break;
            case ItemMessageType.Swap:
                buildSwapMessage(msg, data);
                break;
            case ItemMessageType.Add:
                buildAddMessage(msg, data);
                break;
            case ItemMessageType.Drop:
                buildDropMessage(msg, data);
                break;
            // TODO: implement 
            //case ItemMessageType.Error:
            //    msg.write('i32>', data);
            //    console.log(data);
            //    break;
        }

        session.write(msg.build());
    }
}
