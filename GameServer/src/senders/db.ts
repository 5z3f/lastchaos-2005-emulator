import log from '@local/shared/logger';
import Message from '@local/shared/message';
import Session from '@local/shared/session';
import { SendersType } from '.';
import _messages from './_messages.json';

const WEAR_COUNT = 7;

// TODO: unused s2s message types will be removed probably
export enum DBMessageType {
    Success,
    OK,
    CharacterExist,
    CharacterExistEnd,
    OtherServer,
}

interface DBCharacter {
    id: number;
    nickname: string;
    class: number;
    profession: number;
    hair: number;
    face: number;
    level: number;
    experience: number;
    skillpoints: number;
    recentHealth: number;
    recentMana: number;
}

interface WearingItem {
    wearingPosition: number;
    itemId?: number;
    plus?: number;
}

interface DBMessageData {
    subType: DBMessageType;
    dbCharacter?: DBCharacter;
    wearingItems?: WearingItem[];
}

function buildCharacterExistMessage(msg: Message, dbCharacter: DBCharacter, wearingItems: WearingItem[]) {
    msg.write('i32>', dbCharacter.id);              // Character ID (UID)
    msg.write('stringnt', dbCharacter.nickname);    // Nickname
    msg.write('u8', dbCharacter.class);             // Class
    msg.write('u8', dbCharacter.profession || 0);   // Profession
    msg.write('u8', dbCharacter.hair);              // Hair
    msg.write('u8', dbCharacter.face);              // Face
    msg.write('i32>', dbCharacter.level);           // Level
    msg.write('u64>', dbCharacter.experience);      // Current Experience
    msg.write('u64>', 100);                         // TODO: Max Experience
    msg.write('i32>', dbCharacter.skillpoints);     // Skill Points
    msg.write('i32>', dbCharacter.recentHealth);    // Current Health Points
    msg.write('i32>', dbCharacter.recentHealth);    // TODO: Max Health Points
    msg.write('i32>', dbCharacter.recentMana);      // Current Mana Points
    msg.write('i32>', dbCharacter.recentMana);      // TODO: Max mana Points

    for (let pos = 0; pos < WEAR_COUNT; pos++) {
        const item = wearingItems.find((i) => i.wearingPosition === pos);

        msg.write('i32>', item?.itemId || -1);
        msg.write('i32>', item?.plus || 0);
    }

    msg.write('i32>', -1);                          // Remain Character Delete Time
}

export default function (session: Session<SendersType>) {
    return ({ subType, dbCharacter, wearingItems }: DBMessageData) => {
        const msg = new Message({ type: _messages.MSG_DB, subType: subType });

        switch (subType) {
            case DBMessageType.CharacterExist:
                {
                    if (!dbCharacter) {
                        log.error('dbCharacter is not defined');
                        return;
                    }

                    if (!wearingItems) {
                        log.error('wearingItems is not defined');
                        return;
                    }

                    buildCharacterExistMessage(msg, dbCharacter, wearingItems);
                }
                break;
            case DBMessageType.CharacterExistEnd:
            case DBMessageType.OK:
                // only subType is needed here
                break;
            case DBMessageType.Success:
            case DBMessageType.OtherServer:
                // TODO: handle it
                break;
            default:
                log.error(`Unhandled message subtype: ${subType}`);
                break;
        }

        session.write(msg.build());
    }
}
