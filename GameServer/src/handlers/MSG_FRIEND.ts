import Message from '@local/shared/message';
import Session from '@local/shared/session';
import api from '../api';
import game from '../game';
import { GameObjectType } from '../gameobject';
import Character from '../gameobject/character';
import { SendersType } from '../senders';
import { FailMessageType } from '../senders/fail';
import { Color } from '../system/core/chat';
import Invite, { InviteType } from '../system/core/invite';

export enum FriendStatusType {
    Offline,
    Online,
    Busy,
}

export enum FriendMessageType {
    Error = 0,
    Request = 1,
    FriendshipAccept = 2,
    ChangeStatus = 3,
    MSG_FRIEND_CHATTING = 4,
    FriendshipCancel = 5,
    Delete = 6,
    NotifyAdd = 7,
    NotifyDelete = 8,
    List = 9,
}

export enum FriendMessageErrorType {
    OK = 0,
    Packet = 1,
    IsOffline = 2,
    FullMember = 3,
    AlreadyExist = 4,
    WaitOther = 5,
    NotMatchIndex = 6,
    HelperServer = 7,
    GameServer = 8,
    IncorrectNameLength = 9,
    AlreadyBlock = 10,
    NotBlock = 11,
    RegistRefusePVP = 12,
}

// TODO: move it (almost all) into system/core/messenger.ts

async function handleFriendshipRequest(session: Session<SendersType>, msg: Message) {
    const requesterUid = msg.read('i32>');
    const receiverName = msg.read('stringnt');

    if (receiverName.length < 2 || receiverName.length > 16) {
        session.send.friend({ subType: FriendMessageType.Error, code: FriendMessageErrorType.IncorrectNameLength });
        return;
    }

    const character = session.character!;

    if (requesterUid != character.uid) {
        // TODO: packet is malformed, log it
        return;
    }

    const receiverCharacter: Character = game.world.find(GameObjectType.Character, (ch: Character) => ch.nickname === receiverName);

    // TODO: offline invites (if possible?)
    if (!receiverCharacter) {
        session.send.friend({ subType: FriendMessageType.Error, code: FriendMessageErrorType.IsOffline });
        return;
    }

    // TODO: Multiple pending invites (if possible?)
    const anotherPendingInvite = game.invites.find(i => i.type === InviteType.Friend && i.receiverId === receiverCharacter.id && i.requesterId != character.id);
    if (anotherPendingInvite) {
        session.send.friend({ subType: FriendMessageType.Error, code: FriendMessageErrorType.WaitOther });
        return;
    }

    // TODO: check if they're already friends
    // TODO: refuse to create invite if receiver is in pvp mode

    // remove previous invite (if exists)
    const previousPendingInvite = game.invites.find(i => i.type === InviteType.Friend && i.receiverId === receiverCharacter.id && i.requesterId === character.id);

    if (previousPendingInvite)
        await previousPendingInvite.remove();

    const invite = await Invite.create(InviteType.Friend, character, receiverCharacter);

    if (!invite) {
        session.send.fail(FailMessageType.DatabaseFailure);
        return;
    }

    game.invites.push(invite);

    receiverCharacter.session.send.friend({
        subType: FriendMessageType.Request,
        requesterIndex: requesterUid,
        requesterName: character.nickname,
    });

    api.chat.system(character, `You have sent a friend request to ${receiverCharacter.nickname}.`, Color.Silver);
    api.chat.system(receiverCharacter, `${character.nickname} has sent you a friend request.`, Color.Silver);
}

async function handleFriendshipAccept(session: Session<SendersType>, msg: Message) {
    const receiverUid = msg.read('i32>');
    const requesterName = msg.read('stringnt');
    const character = session.character!;

    if (receiverUid != character.uid) {
        // TODO: packet is malformed, log it
        return;
    }

    // TODO: multiple pending invites (if possible?)
    const invite = game.invites.find(i => i.type === InviteType.Friend && i.receiverId === character.id);

    if (!invite) {
        session.send.friend({
            subType: FriendMessageType.Error,
            code: FriendMessageErrorType.Packet
        });
        return;
    }

    const resolved = await invite.resolve(true);

    if (!resolved) {
        session.send.friend({
            subType: FriendMessageType.Error,
            code: FriendMessageErrorType.Packet // couldn't resolve invite
        });
        return;
    }
}

async function handleFriendshipCancel(session: Session<SendersType>, msg: Message) {
    const requesterUid = msg.read('i32>');
    const requesterName = msg.read('stringnt');

    // receiverUid is unused in this message, always 0 kek
    if (requesterUid != 0) {
        // TODO: packet is malformed, log it
        return;
    }

    const character = session.character!;
    const invite = game.invites.find(i => i.type === InviteType.Friend && i.receiverId === character.id);

    if (!invite) {
        session.send.friend({
            subType: FriendMessageType.Error,
            code: FriendMessageErrorType.Packet
        });
        return;
    }

    const resolved = await invite.resolve(false);

    if (!resolved) {
        session.send.friend({
            subType: FriendMessageType.Error,
            code: FriendMessageErrorType.Packet // couldn't resolve invite
        });
        return;
    }
}

async function handleFriendshipDelete(session: Session<SendersType>, msg: Message) {
    const requesterId = msg.read('i32>');
    const targetId = msg.read('i32>');
    const nickname = msg.read('stringnt');
    const character = session.character!;

    if (requesterId != character.uid) {
        // TODO: packet is malformed, log it
        return;
    }

    const requesterCharacter: Character = game.world.find(GameObjectType.Character, (ch: Character) => ch.uid === character.uid);
    requesterCharacter.messenger.removeFriend(targetId);
}

function handleStatusChange(session: Session<SendersType>, msg: Message) {
    const characterUid = msg.read('i32>');
    const status = msg.read('i32>') as FriendStatusType;

    if (!(status in FriendStatusType)) {
        // packet is malformed, log it
        return;
    }

    const character = session.character!;
    if (characterUid != character.uid) {
        // TODO: packet is malformed, log it
        return;
    }

    character.messenger.status = status;
}


export default function (session: Session<SendersType>, msg: Message) {
    const subType = msg.read('u8');

    switch (subType) {
        case FriendMessageType.Request:
            handleFriendshipRequest(session, msg);
            break;
        case FriendMessageType.FriendshipAccept:
            handleFriendshipAccept(session, msg);
            break;
        case FriendMessageType.FriendshipCancel:
            handleFriendshipCancel(session, msg);
            break;
        case FriendMessageType.Delete:
            handleFriendshipDelete(session, msg);
            break;
        case FriendMessageType.ChangeStatus:
            handleStatusChange(session, msg);
            break;
        default:
            console.log(`Unhandled subtype: ${subType}`);
    }
}
