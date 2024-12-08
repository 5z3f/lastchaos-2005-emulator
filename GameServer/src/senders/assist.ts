import log from '@local/shared/logger';
import Message from '@local/shared/message';
import type Session from '@local/shared/session';
import type { SendersType } from '.';
import _messages from './_messages.json';

export enum AssistMessageType {
    Add,
    Delete,
    List,
}

interface AssistData {
    objType: number;
    objIndex: number;
    itemIndex: number;
    skillIndex: number;
    skillLevel?: number;
    remainTime?: number;
}

export default function (session: Session<SendersType>) {
    return (subType: AssistMessageType, data: AssistData) => {
        const msg = new Message({ type: _messages.MSG_ASSIST, subType });

        switch (subType) {
            case AssistMessageType.Add:
                msg.write('u8', data.objType);
                msg.write('i32>', data.objIndex);
                msg.write('i32>', data.itemIndex);
                msg.write('i32>', data.skillIndex);
                msg.write('u8', data.skillLevel);
                msg.write('i32>', data.remainTime);
                break;
            case AssistMessageType.Delete:
                msg.write('u8', data.objType);
                msg.write('i32>', data.objIndex);
                msg.write('i32>', data.itemIndex);
                msg.write('i32>', data.skillIndex);
                break;
            // TODO: implement this
            // case AssistMessageType.List:
            //     msg.write('i32>', 0);
            //     msg.write('u8', 1);
            //     msg.write('i32>', -1);         // 0xff, 0xff, 0xff, 0xff
            //     msg.write('i32>', 163);        // 0x0, 0x0, 0x0, 0xa3
            //     msg.write('u8', 6);       // 0x6
            //     msg.write('i32>', 999999);     // 0x0, 0x0, 0x2e, 0xe0
            //     break;
            default:
                log.error(`Unhandled message subtype: ${subType}`);
        }

        session.write(msg.build());
    }
}
