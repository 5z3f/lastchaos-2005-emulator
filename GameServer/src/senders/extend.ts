import Message from '@local/shared/message';
import Session from '@local/shared/session';
import game from '../game';
import _messages from './_messages.json';

import { SendersType } from '.';
import { GameObjectType } from '../gameobject';
import type Character from '../gameobject/character';
import { ExtendMessageType, ExtendMessengerType } from '../handlers/MSG_EXTEND';

type ExtendMessageGroupListData = {
    subType: ExtendMessageType.Messenger;
    thirdType: ExtendMessengerType.GroupList;

    groupCount: number;
    groupId: number;
    groupName: string;
}

type ExtendMessageChatData = {
    subType: ExtendMessageType.Messenger;
    thirdType: ExtendMessengerType.Chat;

    senderUid: number;
    receiverUid: number;
    colorId: number;
    text: string;
}

type ExtendMessageInviteData = {
    subType: ExtendMessageType.Messenger;
    thirdType: ExtendMessengerType.Invite;

    senderUid: number;
    receiverUid: number;
    senderNickname?: string;
}

type ExtendMessageOneVsOneData = {
    subType: ExtendMessageType.Messenger;
    thirdType: ExtendMessengerType.OneVsOne;

    senderUid: number;
    senderNickname?: string;
    receiverUid: number;
    colorId: number;
    text: string;
}

type ExtendMessageData = ExtendMessageGroupListData | ExtendMessageChatData | ExtendMessageInviteData | ExtendMessageOneVsOneData;

export default function (session: Session<SendersType>) {
    return (data: ExtendMessageData) => {
        const msg = new Message({ type: _messages.MSG_EXTEND });

        // we can't write subType directly because it's a int32 here
        msg.write('i32>', data.subType);

        switch (data.subType) {
            case ExtendMessageType.Messenger:
                msg.write('u8', data.thirdType);

                switch (data.thirdType) {
                    case ExtendMessengerType.GroupList:
                        // TODO: implement multiple groups
                        msg.write('i32>', data.groupCount);
                        msg.write('i32>', data.groupId);
                        msg.write('stringnt', data.groupName);
                        break;
                    case ExtendMessengerType.Chat:
                        msg.write('i32>', data.senderUid);
                        msg.write('i32>', data.receiverUid);
                        msg.write('i32>', data.colorId);
                        msg.write('stringnt', data.text);
                        break;
                    case ExtendMessengerType.Invite:
                        msg.write('i32>', data.senderUid);
                        msg.write('i32>', data.receiverUid);
                        msg.write('stringnt', data.senderNickname);
                        break;
                    case ExtendMessengerType.OneVsOne:
                        const senderChar = game.world.find(GameObjectType.Character, (c: Character) => c.uid === data.senderUid);

                        msg.write('i32>', data.senderUid);
                        msg.write('stringnt', data.senderNickname || senderChar.nickname);
                        msg.write('i32>', data.receiverUid);
                        msg.write('i32>', data.colorId);
                        msg.write('stringnt', data.text);
                        break;

                }
        }

        session.write(msg.build());
    }
}
