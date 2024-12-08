import Message from '@local/shared/message';
import type Session from '@local/shared/session';
import type { SendersType } from '.';
import _messages from './_messages.json';

export type AttackMessage = {
    attackerObjType: number;
    attackerIndex: number;
    targetObjType: number;
    targetIndex: number;
    attackType: number;
    multicount?: number;
}

export default function (session: Session<SendersType>) {
    return ({ attackerObjType, attackerIndex, targetObjType, targetIndex, attackType, multicount }: AttackMessage) => {
        const msg = new Message({ type: _messages.MSG_ATTACK });

        msg.write('u8', attackerObjType);
        msg.write('i32>', attackerIndex);
        msg.write('u8', targetObjType);
        msg.write('i32>', targetIndex);
        msg.write('u8', attackType);
        msg.write('u8', multicount ?? 0); // private dungeon
        //msg.write('i32>', targetIndex); // private dungeon

        session.write(msg.build());
    }
}
