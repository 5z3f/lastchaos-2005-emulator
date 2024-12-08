import App from '../app';

import Message from '@local/shared/message';
import type Session from '@local/shared/session';
import type { SendersType } from '.';
import type { PositionProps } from '../types/position';
import _messages from './_messages.json';

const clientHigherThan1107 = App.config.gameserver.clientVersion > 1107;

export type AtMessage = {
    uid: number,
    name: string,
    classType: number,
    jobType: number,
    hairType: number,
    faceType: number,
    zoneId: number,
    areaId: number,
    position: PositionProps,
};

export default function (session: Session<SendersType>) {
    return ({ uid, name, classType, jobType, hairType, faceType, zoneId, areaId, position }: AtMessage) => {
        const msg = new Message({ type: _messages.MSG_AT });

        msg.write('i32>', uid);                        // Unique ID
        msg.write('stringnt', name);                   // Name
        msg.write('u8', classType);                    // Class
        msg.write('u8', jobType);                      // Job
        msg.write('u8', hairType);                     // Hair
        msg.write('u8', faceType);                     // Face
        msg.write('i32>', zoneId);                     // Zone ID
        msg.write('i32>', areaId);                     // Area ID
        msg.write('f<', position.x);                   // X
        msg.write('f<', position.y);                   // Z
        msg.write('f<', position.z);                   // H
        msg.write('f<', position.r);                   // R
        msg.write('u8', position.layer);               // LAYER
        msg.write('i32>', 1);                          // m_desc->m_index
        msg.write('i32>', 0);                          // m_guildoutdate

        if (clientHigherThan1107) {
            msg.write('u8', 0);                        // m_plusEffect
            msg.write('u8', 0);                        // ch->GetMapAttr()
            msg.write('i32>', 0);                      // secretkey
        }

        session.write(msg.build());
    }
}
