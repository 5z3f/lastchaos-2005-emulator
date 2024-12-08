import log from "@local/shared/logger";
import api from "../../api";
import database from "../../database";
import game from "../../game";
import { GameObjectType } from "../../gameobject";
import Character from "../../gameobject/character";
import { Color } from "./chat";

export enum InviteType {
    Friend,
    Guild,
    Party,
}

export default class Invite {
    id: number;
    type: InviteType;
    requesterId: number;
    receiverId: number;

    constructor(id: number, inviteType: InviteType, requesterId: number, receiverId: number) {
        this.id = id;
        this.type = inviteType;
        this.requesterId = requesterId;
        this.receiverId = receiverId;
    }

    public static async create(inviteType: InviteType, requesterCharacter: Character, receiverCharacter: Character) {
        const dbInviteId = await database.invites.create(inviteType, requesterCharacter.id, receiverCharacter.id);

        if (!dbInviteId)
            return false;

        return new Invite(dbInviteId, inviteType, requesterCharacter.id, receiverCharacter.id);
    }

    public async remove() {
        const result = await database.invites.delete(this.id);

        if (!result) {
            log.error(`Failed to remove invite ${this.id}.`);
            return;
        }

        game.invites.splice(game.invites.indexOf(this), 1);
    }

    public async resolve(accepted: boolean) {
        // find requester and receiver
        const requesterCharacter = game.world.find(GameObjectType.Character, (ch: Character) => ch.id === this.requesterId);
        const receiverCharacter = game.world.find(GameObjectType.Character, (ch: Character) => ch.id === this.receiverId);

        if (!receiverCharacter) {
            log.error(`Failed to resolve invite ${this.id}.`);
            return false;
        }

        // update invite in database
        const result = await database.invites.resolve(this.id, Number(accepted));

        if (!result) {
            log.error(`Failed to resolve invite ${this.id}.`);
            return false;
        }

        if (!accepted) {
            if (!requesterCharacter)
                return false;

            /*
                // this message will print 2082 string id in the system chat
                // but since we can send custom system messages, we don't need it

                requesterCharacter.session.send.friend({
                    subType: FriendMessageType.FriendshipCancel,
                });
            */

            api.chat.system(requesterCharacter, `${receiverCharacter.nickname} declined your request.`, Color.IndianRed);
            return true;
        }

        if (this.type === InviteType.Friend) {

            // create friend pair
            const result = await database.friends.create(this.requesterId, this.receiverId);

            if (!result) {
                log.error(`Failed to create friend pair for ${this.requesterId} and ${this.receiverId}.`);
                return false;
            }

            // create friend pair in game
            requesterCharacter.messenger.addFriend(receiverCharacter.id);
            receiverCharacter.messenger.addFriend(requesterCharacter.id);
        }

        return true;
    }
}
