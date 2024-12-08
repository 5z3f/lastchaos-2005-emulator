import Message from "@local/shared/message";
import Session from "@local/shared/session";
import { SendersType } from "../senders";
import { EffectMessageType } from "../senders/effect";

// client randomly refuses to send MSG_SKILL_READY (always when im moving), and i cant find any pattern in it (tried two different client versions)
// the funniest thing is that it prints "Using <skillname>", but it doesn't send the packet and THERE IS NO "CANCEL" CONDITION AFTER IT
// UPDATE: IT WORKS EVERY TIME WHEN I SET BREAKPOINT ON SendToServerNew FUNCTION INSIDE CNetworkLibrary::SendSkillMessage ???????
// UPDATE: ok it probably has something to do with the MSG_MOVE_STOP packet, need to figure it out

export default async function (session: Session<SendersType>, msg: Message) {
    const subTypeMap = {
        2: 'MSG_SKILL_READY',
        3: 'MSG_SKILL_FIRE',
        // TODO: 
    };

    console.log('SKILL RECEIVED!!!!!!!!!!!!1')
    const subType = msg.read('u8');
    console.log('skill subtype', subType);

    const subTypeHandler = {
        MSG_SKILL_READY: () => {
            const data = {                      // triple bash                      // concentration
                objType: msg.read('u8'),        // 0x0                              0x0, 0x0, 0x0, 0x0
                objUid: msg.read('i32>'),       // 0x0, 0x0, 0x0, 0x8               0x0, 0x0, 0x0, 0x8
                skillId: msg.read('i32>'),      // 0x0, 0x0, 0x0, 0xe6              0x0, 0x0, 0x0, 0xa3
                targetObjType: msg.read('u8'),  // 0x1                              0x0
                targetUid: msg.read('i32>'),    // 0x0, 0x0, 0x6, 0x9b              0x0, 0x0, 0x0, 0x8
                unk1: msg.read('u8'),           // placeholder, left by barunson
                skillspeed: msg.read('i32>'),   // placeholder, left by barunson

                // used by nSkillIndex == 401 && ubMove == 1
                ubMove: msg.read('u8'),
                x: msg.read('f<'),
                y: msg.read('f<'),
                z: msg.read('f<'),
                r: msg.read('f<'),
                layer: msg.read('u8')
            }

            console.log('skill ready', data);
            session.send.skill(2, data);
        },

        MSG_SKILL_FIRE: () => {
            const data = {                      // triple bash
                objType: msg.read('u8'),        // 0x0
                objUid: msg.read('i32>'),       // 0x0, 0x0, 0x0, 0x8
                skillId: msg.read('i32>'),      // 0x0, 0x0, 0x0, 0xe6
                targetObjType: msg.read('u8'),  // 0x1
                targetUid: msg.read('i32>'),    // 0x0, 0x0, 0x6, 0x9b
                targetCount: msg.read('u8'),    // 0x0
                targets: [],

                skillSpeed: -1, // tmp
                cMoveChar: 0, // tmp
                x: 0, // tmp
                y: 0, // tmp
                z: 0, // tmp
                r: 0, // tmp
                layer: 0 // tmp
            }

            for (let i = 0; i < data.targetCount; i++) {
                // @ts-ignore
                data.targets.push({
                    targetObjType: msg.read('u8'),
                    targetUid: msg.read('i32>'),
                })
            }

            data.skillSpeed = msg.read('i32>');
            data.cMoveChar = msg.read('u8');

            data.x = msg.read('f<');
            data.y = msg.read('f<');
            data.z = msg.read('f<');
            data.r = msg.read('f<');
            data.layer = msg.read('u8');


            session.send.skill(3, data);

            session.send.effect({
                subType: EffectMessageType.Skill,
                skillId: data.skillId,
                objType: data.targetObjType,
                charUid: data.targetUid

            })
        },
    }

    if (subTypeMap[subType] in subTypeHandler)
        subTypeHandler[subTypeMap[subType]]();
}
