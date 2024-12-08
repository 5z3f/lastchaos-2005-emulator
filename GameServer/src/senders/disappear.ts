import Message from '@local/shared/message';
import Session from '@local/shared/session';
import { SendersType } from '.';
import _messages from './_messages.json';

export type DisappearMessage = {
    objType: number;
    uid: number;
};

export default function (session: Session<SendersType>) {
    return ({ objType, uid }: DisappearMessage) => {
        const msg = new Message({ type: _messages.MSG_DISAPPEAR });

        msg.write('u8', objType);
        msg.write('i32>', uid);

        session.write(msg.build());
    }
}
