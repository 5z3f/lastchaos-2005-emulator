import Message from '@local/shared/message';
import Session from '@local/shared/session';
import { SendersType } from '.';
import { ChatType, Color } from '../system/core/chat';
import _messages from './_messages.json';

type ChatMessageData = {
    subType: ChatType;
    senderId?: number;
    senderName?: string;
    receiverName?: string;
    text: string;
    color?: Color;
};

// FIXME: temporary(?) solution to send custom system messages
function buildSystemMessage(msg: Message, color: Color, text: string) {
    msg.write('i32>', 7);                   // MSG_EVENT_WHITEDAY_2007_LETTER_REP
    msg.write('u32>', color);
    msg.write('stringnt', text);
}

function buildMessage(msg: Message, senderId: number, senderName: string, receiverName: string, text: string) {
    msg.write('i32>', senderId);
    msg.write('stringnt', senderName);
    msg.write('stringnt', receiverName);
    msg.write('stringnt', text);
}

export default function (session: Session<SendersType>) {
    return (data: ChatMessageData) => {
        if (data.subType === ChatType.System) {
            // type: MSG_EVENT, subType: MSG_EVENT_WHITEDAY_2007
            const msg = new Message({ type: 43, subType: 45 });
            buildSystemMessage(msg, data.color || Color.None, data.text);
            session.write(msg.build());
            return;
        }

        const msg = new Message({ type: _messages.MSG_CHAT, subType: data.subType });
        buildMessage(msg, data.senderId || 0, data.senderName || '', data.receiverName || '', data.text);
        session.write(msg.build());
    }
}
