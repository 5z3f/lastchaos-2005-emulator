import Message from '@local/shared/message';
import Session from '@local/shared/session';
import { SendersType } from '.';
import _messages from './_messages.json';

export enum SystemMessageType {
    CannotWear = 2,
    FullInventory = 3,
    Overloaded = 10,
    OverloadedWarning = 28,
};

export default function (session: Session<SendersType>) {
    return (subType: SystemMessageType) => {
        const msg = new Message({ type: _messages.MSG_SYS, subType: subType })
        session.write(msg.build());
    }
}
