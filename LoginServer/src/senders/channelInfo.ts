import Message from '@local/shared/message';
import Session from '@local/shared/session';
import { SendersType } from '.';
import app from '../app';
import _messages from './_messages.json';

export default function (session: Session<SendersType>) {
    return (data: any) => {
        const msg = new Message({ type: _messages.MSG_LOGINSERV_PLAYER });

        msg.write('i32>', 1);                           // recentServer
        msg.write('i32>', 1);                           // recentSubNum
        msg.write('i32>', 1);                           // connectorCount
        msg.write('i32>', 1);                           // connectorId
        msg.write('i32>', 1);                           // serverNo
        msg.write('i32>', 1);                           // maxServer
        msg.write('u8', 1);                             // recommendServer
        msg.write('i32>', 1);                           // serverSubNo
        msg.write('i32>', 50 + 1999);                   // playerCount
        msg.write('stringnt', app.config.gameserver.host);  // ipAddress
        msg.write('i32>', app.config.gameserver.port);      // port

        session.write(msg.build());
    };
}
