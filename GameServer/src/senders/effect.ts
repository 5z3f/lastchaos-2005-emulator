import Message from '@local/shared/message';
import Session from '@local/shared/session';
import { SendersType } from '.';
import _messages from './_messages.json';

interface SkillData {
    subType: EffectMessageType.Skill;
    skillId: number;
    objType: number;
    charUid: number;
}

interface EtcData {
    subType: EffectMessageType.ETC;
    objType: number;
    charUid: number;
    effectType: number;
}

interface ProduceData {
    subType: EffectMessageType.Produce;
    kind: number;
    objType: number;
    charUid: number;
    targetObjType: number;
    targetUid: number;
    health: number;
}

interface ItemData {
    subType: EffectMessageType.Item;
    objType: number;
    charUid: number;
    itemId: number;
}

export type EffectMessageData = SkillData | EtcData | ProduceData | ItemData;

export enum EffectMessageType {
    Skill,
    ETC,
    Produce,
    Item,
    //Fire,
}

export default function (session: Session<SendersType>) {
    return (data: EffectMessageData) => {
        const msg = new Message({ type: _messages.MSG_EFFECT, subType: data.subType });

        switch (data.subType) {
            case EffectMessageType.Skill:
                msg.write('i32>', data.skillId);
                msg.write('u8', data.objType);
                msg.write('i32>', data.charUid);
                break;
            case EffectMessageType.ETC:
                msg.write('u8', data.objType);
                msg.write('i32>', data.charUid);
                msg.write('u8', data.effectType);
                break;
            case EffectMessageType.Produce:
                msg.write('u8', data.kind);
                msg.write('u8', data.objType);
                msg.write('i32>', data.charUid);
                msg.write('u8', data.targetObjType);
                msg.write('i32>', data.targetUid);
                msg.write('i32>', data.health);
                break;
            case EffectMessageType.Item:
                msg.write('u8', data.objType);
                msg.write('i32>', data.charUid);
                msg.write('i32>', data.itemId);
                break;
            //case EffectMessageType.Fire:
            //    break;
        }

        session.write(msg.build());
    }
}
