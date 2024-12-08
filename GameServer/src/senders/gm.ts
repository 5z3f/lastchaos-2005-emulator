import log from '@local/shared/logger';
import Message from '@local/shared/message';
import Session from '@local/shared/session';
import { SendersType } from '.';
import app from '../app';
import { GMMessageType } from '../handlers/MSG_GM';
import _messages from './_messages.json';

const clientHigherThan1107 = app.config.gameserver.clientVersion > 1107;

function buildWhoAmIMessage(msg: Message, level: number) {
    msg.write('u8', level);

    if (!clientHigherThan1107)
        msg.write('u8', 0);     // kek barunson
}

type GMMessageData = {
    subType: GMMessageType;
    level: number;
};

export default function (session: Session<SendersType>) {
    return ({ subType, level }: GMMessageData) => {
        const msg = new Message({ type: _messages.MSG_GM, subType });

        switch (subType) {
            case GMMessageType.WhoAmI:
                buildWhoAmIMessage(msg, level);
                break;
            default:
                log.error(`Unhandled message subtype: ${subType}`);
        }

        session.write(msg.build());
    }
}
