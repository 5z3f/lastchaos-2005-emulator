import Message from '@local/shared/message';
import type Session from '@local/shared/session';
import type { SendersType } from '.';
import { PacketObjectType } from '../gameobject';
import type { PositionProps } from '../types/position';
import _messages from './_messages.json';

function buildAppearMessageCharacter(msg: Message) {
    msg.write('u8', 1);             // new
    msg.write('u8', 0);             // m_type
    msg.write('i32>', 1);           // m_index
    msg.write('stringnt', 'test');  // name
    msg.write('u8', 1);             // m_job
    msg.write('u8', 1);             // hairstyle
    msg.write('u8', 1);             // facestyle    
    msg.write('f<', 1255);          // X
    msg.write('f<', 341);           // Z
    msg.write('f<', 160);           // H
    msg.write('f<', 0);             // R
    msg.write('u8', 0);             // Y LAYER  
    msg.write('i16>', 100);         // hp
    msg.write('i16>', 1000);        // maxhp    
    msg.write('u8', 0);             // player state
    msg.write('i32>', 0);           // pkpenalty
    msg.write('u8', 0);             // getpkname    

    const armor = [75, 34, 48, 38, 49, 39, 41];
    const plus = [15, 15, 15, 15, 15, 15, 15];

    for (let i = 1; i <= 6; ++i) {
        msg.write('i32>', armor[i - 1]);
        msg.write('i32>', plus[i - 1]);
    }

    msg.write('i32>', 0);           // assist state
    msg.write('u8', 1);             // assist count 

    for (let i = 0; i < 1; i++) {
        msg.write('i32>', -1);
        msg.write('i32>', -1);
        msg.write('u8', 0);
        msg.write('i32>', -1);
    }

    for (let i = 0; i < 1; i++) {
        msg.write('i32>', -1);
        msg.write('i32>', -1);
        msg.write('u8', 0);
        msg.write('i32>', -1);
    }

    msg.write('u8', 0);                     // personal shop mode
    msg.write('stringnt', '');              // title    
    msg.write('i32>', -1);                  // guild id
    msg.write('stringnt', '');              // guild name   
    msg.write('i32>', -1);                  // 
    msg.write('i32>', -1);                  // 
}

interface NPCData {
    objType: PacketObjectType.NPC;
    firstAppearance: boolean;
    uid: number;
    id: number;
    position: PositionProps;
    health: number;
    maxHealth: number;
}

function buildAppearMessageNPC(msg: Message, data: NPCData) {
    msg.write('u8', Number(data.firstAppearance));  // New
    msg.write('u8', 1);                             // Appear Type
    msg.write('i32>', data.uid);                    // Unique ID
    msg.write('i32>', data.id);                     // NPC ID
    msg.write('f<', data.position.x);               // X
    msg.write('f<', data.position.y);               // Z
    msg.write('f<', data.position.z);               // H
    msg.write('f<', data.position.r);               // R
    msg.write('u8', data.position.layer);           // LAYER
    msg.write('i32>', data.health);                 // Health
    msg.write('i32>', data.maxHealth);              // Max Health
    msg.write('i32>', 0);                           // Assist State
    msg.write('u8', 0);                             // Assist Count
    msg.write('u8', 0);                             // Attribute Position
}

// TODO: finish type for CharacterData
type AppearMessageData = NPCData /*| CharacterData*/;

export default function (session: Session<SendersType>) {
    return (data: AppearMessageData) => {
        const msg = new Message({ type: _messages.MSG_APPEAR });

        switch (data.objType) {
            // @ts-ignore
            case PacketObjectType.Character:
                // @ts-ignore
                buildAppearMessageCharacter(msg, data);
                break;
            case PacketObjectType.NPC:
                buildAppearMessageNPC(msg, data);
                break;
            default:
                console.error(`Unknown object type: ${data.objType}`);
                break;
        }

        session.write(msg.build());
    }
}
