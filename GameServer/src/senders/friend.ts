import _messages from './_messages.json';

import Message from '@local/shared/message';
import Session from '@local/shared/session';
import { SendersType } from '.';
import { FriendMessageType, FriendStatusType } from '../handlers/MSG_FRIEND';

type ErrorData = {
    subType: FriendMessageType.Error;
    code: number;
}

type RequestData = {
    subType: FriendMessageType.Request;
    requesterIndex: number;
    requesterName: string;
}

type NotifyAddData = {
    subType: FriendMessageType.NotifyAdd;
    uid: number;
    nickname: string;
    class: number;
    status: number;
}

type NotifyDeleteData = {
    subType: FriendMessageType.NotifyDelete;
    deletedId: number;
}

type FriendshipCancelData = {
    subType: FriendMessageType.FriendshipCancel;
}

type ListData = {
    subType: FriendMessageType.List;
    uid: number;
    nickname: string;
    class: number;
    status: number;
    group: number;
}

type StatusData = {
    subType: FriendMessageType.ChangeStatus;
    requesterId: number;
    status: FriendStatusType;
}

type FriendDataType = ErrorData | RequestData | NotifyAddData | NotifyDeleteData | FriendshipCancelData | ListData | StatusData;

export default function (session: Session<SendersType>) {
    return (data: FriendDataType) => {
        const msg = new Message({ type: _messages.MSG_FRIEND, subType: data.subType });

        switch (data.subType) {
            case FriendMessageType.Error:
                msg.write('i8', data);
                break;
            case FriendMessageType.Request:
                msg.write('i32>', data.requesterIndex);
                msg.write('stringnt', data.requesterName);
                break;
            case FriendMessageType.NotifyAdd:
                msg.write('i32>', data.uid);
                msg.write('stringnt', data.nickname);
                msg.write('i32>', data.class);
                msg.write('i32>', data.status);
                break;
            case FriendMessageType.NotifyDelete:
                msg.write('i32>', data.deletedId);
                break;
            case FriendMessageType.FriendshipCancel:
                // no data
                break;
            case FriendMessageType.List:
                msg.write('i32>', data.uid);
                msg.write('stringnt', data.nickname);
                msg.write('i32>', data.class);
                msg.write('i32>', data.status);
                msg.write('i32>', data.group);
                break;
            case FriendMessageType.ChangeStatus:
                msg.write('i32>', data.requesterId);
                msg.write('i32>', data.status);
        }

        session.write(msg.build());
    }
}
