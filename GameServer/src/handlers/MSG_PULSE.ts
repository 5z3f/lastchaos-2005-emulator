import Message from '@local/shared/message';
import Session from '@local/shared/session';
import { SendersType } from '../senders';

export default function (session: Session<SendersType>, msg: Message) {
    const data = {
        pulseId: msg.read('i32>'),
        nation: msg.read('u8'),
    };

    // TODO: implement pulse handler
}
