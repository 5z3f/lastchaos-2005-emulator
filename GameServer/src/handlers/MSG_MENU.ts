import Message from '@local/shared/message';
import Session from '@local/shared/session';
import database from '../database';
import game from '../game';
import Character from '../gameobject/character';
import { SendersType } from '../senders';
import { DBMessageType } from '../senders/db';
import { FailMessageType } from '../senders/fail';
import { Statistic } from '../system/core/statistic';
import Position from '../types/position';
import { ZoneType } from '../world';

export default function (session: Session<SendersType>, msg: Message) {
    const subType = msg.read('u8');
    const subTypeMap = {
        0: 'MSG_MENU_NEW',
        2: 'MSG_MENU_START',
    };

    const subTypeHandler = {
        MSG_MENU_NEW: async () => {
            const data = {
                nickname: msg.read('stringnt'),
                classId: msg.read('u8'),
                hairId: msg.read('u8'),
                faceId: msg.read('u8'),
                jobId: 0,
            };

            const MAX_CLASSES = 6;
            const MAX_FACESTYLES = 3;
            const MAX_HAIRSTYLES = 3;

            // TODO: packet is probably malformed, log it
            if (data.faceId >= MAX_FACESTYLES || data.hairId >= MAX_HAIRSTYLES || data.jobId >= MAX_CLASSES)
                return;

            const [exists] = (await database.characters.exists(data.nickname))!;

            if (exists) {
                session.send.fail(FailMessageType.NicknameAlreadyTaken);
                return;
            }

            const accountId = session.accountId!;
            const result = await database.characters.create({
                accountId: accountId,
                nickname: data.nickname,
                classId: data.classId,
                faceId: data.faceId,
                hairId: data.hairId
            });

            if (!result) {
                session.send.fail(14); // MSG_FAIL_DB_UNKNOWN
                return;
            }

            const charId = result.insertId;

            // TODO: add standard items here (?)

            // TODO: this code is duplicated, we need to import it from somewhere (origin: MSG_LOGIN)
            const dbCharacters = await database.accounts.getCharacters(accountId);
            if (!dbCharacters) {
                session.send.fail(14); // MSG_FAIL_DB_UNKNOWN
                return;
            }

            for (let dbCharacter of dbCharacters) {
                const wearingItems = await database.characters.getWearingItems(dbCharacter.id);

                if (!wearingItems) {
                    session.send.fail(14); // MSG_FAIL_DB_UNKNOWN
                    return;
                }

                session.send.db({
                    subType: DBMessageType.CharacterExist,
                    // @ts-ignore
                    dbCharacter, wearingItems
                });
            }

            session.send.db({
                subType: DBMessageType.CharacterExistEnd
            });
        },
        MSG_MENU_START: async () => {
            const characterId = msg.read('i32>'); // selected character id

            const dbCharacter = await database.characters.getById(characterId);

            // TODO: packet is malformed, log it
            if (!dbCharacter) {
                session.send.fail(FailMessageType.CharacterDoesntExist);
                return;
            }

            const startingZone = game.world.getZone(ZoneType.Juno);

            const character = new Character({
                session: session,
                uid: session.uid,
                id: dbCharacter.id,
                role: dbCharacter.role,
                classType: dbCharacter.class,
                jobType: dbCharacter.profession,
                zone: startingZone,
                areaId: 0,
                appearance: {
                    hairType: dbCharacter.hair,
                    faceType: dbCharacter.face
                },
                progress: {
                    level: dbCharacter.level,
                    experience: dbCharacter.experience,
                    maxExperience: 100,                                     // FIXME: probably will be removed later (?)
                    skillpoint: dbCharacter.skillpoints,
                },
                //@ts-ignore
                statistics: {
                    runSpeed: new Statistic(20.0),
                    attack: new Statistic(100),                                     // TODO:
                    magicAttack: new Statistic(100),                                // TODO:
                    defense: new Statistic(100),                                    // TODO:
                    magicResist: new Statistic(100),                                // TODO:
                    walkSpeed: new Statistic(10.0),                                 // TODO:
                    attackRange: new Statistic(2.3),                                // TODO:
                    attackSpeed: new Statistic(10.0),                               // TODO:
                },
                statpoints: {
                    availablePoints: dbCharacter.statpoints,
                    strength: dbCharacter.strength,
                    dexterity: dbCharacter.dexterity,
                    intelligence: dbCharacter.intelligence,
                    condition: dbCharacter.condition,
                },
                nickname: dbCharacter.nickname,
                position: new Position(1111, 951, 160.3)                    // TODO: add default spawnpoints and radius on it
            });

            // pin character to our session
            session.pinCharacter(character);

            // send start game message
            session.send.db({
                subType: DBMessageType.OK,
            })
        }
    };

    if (subTypeMap[subType] in subTypeHandler)
        subTypeHandler[subTypeMap[subType]]();
}
