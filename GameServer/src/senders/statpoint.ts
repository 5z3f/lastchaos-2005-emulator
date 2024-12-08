import Message from '@local/shared/message';
import Session from '@local/shared/session';
import { SendersType } from '.';
import _messages from './_messages.json';

export type StatpointMessage = {
    points?: number;
    //} | {
    type?: number;
    value?: number;
    remainingPoints?: number;
    //} | {
};

export default function (session: Session<SendersType>) {
    return (subType: number, data: StatpointMessage) => {
        const msg = new Message({ type: _messages.MSG_STATPOINT, subType: subType });

        const subTypeMap = {
            0: 'MSG_STATPOINT_REMAIN',
            1: 'MSG_STATPOINT_USE',
            2: 'MSG_STATPOINT_ERROR',
        };

        const subTypeHandler = {
            MSG_STATPOINT_REMAIN: () => {
                msg.write('i32>', data.points);
            },
            MSG_STATPOINT_USE: () => {
                msg.write('u8', data.type);
                msg.write('i32>', data.value);
                msg.write('i32>', data.remainingPoints);
            },
            MSG_STATPOINT_ERROR: () => { },
        };

        const subType1 = subTypeMap[subType as keyof typeof subTypeMap];
        if (subType1 in subTypeHandler)
            subTypeHandler[subType1 as keyof typeof subTypeHandler]();


        session.write(msg.build());
    }
}
