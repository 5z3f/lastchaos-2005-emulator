import Message from '@local/shared/message';
import Session from '@local/shared/session';
import { SendersType } from '.';
import _messages from './_messages.json';

export default function (session: Session<SendersType>) {
    return () => {
        const msg = new Message({ type: _messages.MSG_PULSE });

        msg.write('i32>', 0);       // pulse id
        msg.write('u8', 9);         // nation

        session.write(msg.build());
    }
}
