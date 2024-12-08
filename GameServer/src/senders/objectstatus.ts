import Message from '@local/shared/message';
import Session from '@local/shared/session';
import { SendersType } from '.';
import _messages from './_messages.json';

export type ObjectStatusMessage = {
    type: number;
    uid: number;
    health: number;
    maxHealth: number;
    mana: number;
    maxMana: number;
    pkPenalty?: number;
    pkName?: number;
    //m_state: number;
    //state2: number;
};

export default function (session: Session<SendersType>) {
    return (data: ObjectStatusMessage) => {
        const msg = new Message({ type: _messages.MSG_CHAR_STATUS });

        msg.write('u8', data.type);
        msg.write('i32>', data.uid);
        msg.write('i32>', data.health);
        msg.write('i32>', data.maxHealth);
        msg.write('i32>', data.mana);
        msg.write('i32>', data.maxMana);

        // MSG_CHAR_PC
        if (data.type == 0) {
            msg.write('i32>', data.pkPenalty);
            msg.write('u8', data.pkName);
        }
        else {
            msg.write('i32>', 0);
            msg.write('u8', 0);
        }

        msg.write('i32>', 0); // assist m_state
        msg.write('i32>', 0); // state2 (?)

        session.write(msg.build());
    }
}
