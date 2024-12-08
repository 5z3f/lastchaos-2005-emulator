import log from "@local/shared/logger";
import api from "../../api";
import database from "../../database";
import game from "../../game";
import { GameObjectType } from "../../gameobject";
import Character, { ClassType } from "../../gameobject/character";
import { FriendMessageType, FriendStatusType } from "../../handlers/MSG_FRIEND";
import { FailMessageType } from "../../senders/fail";
import { Color } from "./chat";

class MessengerMessage {
    senderId: number;
    receiverId: number;
    text: string;
    sent: boolean;
    date: Date;

    constructor(senderId: number, receiverId: number, text: string, sent: boolean, date: Date) {
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.text = text;
        this.sent = sent;
        this.date = date;
    }
}

export enum ChatType {
    Normal,
    Whisper,
    Party,
    Guild,
    Shout,
    Private,
}

class Friend {
    owner: Character;
    id: number;
    nickname: string;
    class: ClassType;
    status: FriendStatusType = FriendStatusType.Offline;
    history: MessengerMessage[] = [];

    constructor(owner: Character, id: number, nickname: string, classType: ClassType) {
        this.owner = owner;
        this.id = id;
        this.nickname = nickname;
        this.class = classType;
    }

    public remove() {
        this.owner.messenger.friends.splice(this.owner.messenger.friends.indexOf(this), 1);
    }

    public async loadHistory() {
        const results = await database.chatlog.get(ChatType.Private, this.id, this.owner.id);

        if (!results) {
            log.error(`Failed to load chat history for ${this.id} and ${this.owner.id}.`);
            return;
        }

        for (let result of results) {
            const messengerMsg = new MessengerMessage(
                result.sender,
                result.receiver,
                result.text,
                !!result.sent,
                result.createdAt
            );

            this.history.push(messengerMsg);
        }
    }

    public show() {
        const friendCharacter: Character = game.world.find(GameObjectType.Character, (ch: Character) => ch.id === this.id);
        this.status = friendCharacter ? friendCharacter.messenger.status : FriendStatusType.Offline;

        this.owner.session.send.friend({
            subType: FriendMessageType.NotifyAdd,
            uid: this.id,
            nickname: this.nickname,
            class: this.class,
            status: this.status
        });
    }
}

export default class Messenger {
    owner: Character;
    friends: Friend[] = [];
    private _status: FriendStatusType = FriendStatusType.Offline;

    constructor(owner: Character) {
        this.owner = owner;
        this.loadFriends();
    }

    public get status(): FriendStatusType {
        return this._status;
    }

    public set status(status: FriendStatusType) {
        this._status = status;

        for (let friend of this.friends) {
            const friendCharacter = game.world.find(GameObjectType.Character, (ch: Character) => ch.id === friend.id);

            if (!friendCharacter)
                continue;

            const meAsFriend: Friend = friendCharacter.messenger.friends.find((f: Friend) => f.id === this.owner.id);

            if (!meAsFriend)
                continue;

            meAsFriend.status = this._status;

            friendCharacter.session.send.friend({
                subType: FriendMessageType.ChangeStatus,
                requesterId: this.owner.id,
                status: this._status
            });
        }
    }

    private async loadFriends() {
        const dbFriends = await database.friends.get(this.owner.id);

        if (!dbFriends) {
            this.owner.session.send.fail(FailMessageType.DatabaseFailure);
            return false;
        }


        for (let dbFriend of dbFriends) {
            const friend = new Friend(this.owner, dbFriend.friendId, dbFriend.nickname, dbFriend.class);
            await friend.loadHistory();

            this.friends.push(friend);
        }
    }


    public async addFriend(characterId: number) {
        const dbFriendCharacter = await database.characters.getById(characterId);
        if (!dbFriendCharacter)
            return;

        const friend = new Friend(this.owner, characterId, dbFriendCharacter.nickname, dbFriendCharacter.class);
        await friend.loadHistory();

        this.friends.push(friend);
        friend.show();
    }

    public async removeFriend(characterId: number) {
        const friend = this.friends.find(f => f.id === characterId);

        if (!friend) {
            log.error(`Failed to find friend ${characterId} in ${this.owner.id}'s friend list.`);
            return;
        }

        const result = await database.friends.delete(this.owner.id, characterId);

        if (!result) {
            log.error(`Failed to remove friend ${characterId} from ${this.owner.id}. (Database failure)`);
            return;
        }

        friend.remove();

        const friendCharacter = game.world.find(GameObjectType.Character, (ch: Character) => ch.id === characterId);

        if (!friendCharacter)
            return;

        const meAsFriend: Friend = friendCharacter.messenger.friends.find((f: Friend) => f.id === this.owner.id);

        if (!meAsFriend) {
            log.error(`Failed to find ${this.owner.id} in ${friendCharacter.id}'s friend list.`)
            return;
        }

        meAsFriend.remove();

        friendCharacter.session.send.friend({
            subType: FriendMessageType.NotifyDelete,
            deletedId: this.owner.id
        });

        api.chat.system(friendCharacter, `${this.owner.nickname} has ended the friendship with you.`, Color.IndianRed);
    }
}
