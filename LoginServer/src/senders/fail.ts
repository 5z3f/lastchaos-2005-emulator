import Message from '@local/shared/message';
import session from '@local/shared/session';
import { SendersType } from '.';
import _messages from './_messages.json';

export default function (session: session<SendersType>) {
    return (subType: number) => {
        const msg = new Message({ type: _messages.MSG_FAIL, subType: subType })
        session.write(msg.build());
    };
}
