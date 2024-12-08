import Message from '@local/shared/message';
import type Session from '@local/shared/session';
import type { SendersType } from '.';
import _messages from './_messages.json';

export type AutoAttackMessage = {
    attackType: number;
    targetObjType: number;
    targetIndex: number;
};

export default function (session: Session<SendersType>) {
    return ({ attackType, targetObjType, targetIndex }: AutoAttackMessage) => {
        const msg = new Message({ type: _messages.MSG_RIGHT_ATTACK });

        msg.write('u8', attackType);
        msg.write('u8', targetObjType);
        msg.write('i32>', targetIndex);

        session.write(msg.build());
    }
}
