import Message from '@local/shared/message';
import type Session from '@local/shared/session';
import type { SendersType } from '.';
import _messages from './_messages.json';

// TODO: refactor this

export enum MessageDamageType {
    Melee,
    Range,
    Magic,
}

export type DamageMessage = {
    attackerObjType: number;
    attackerIndex: number;
    damageType: MessageDamageType;
    skillId: number;
    targetObjType: number;
    targetIndex: number;
    targetHp: number;
    targetMp: number;
    damage: number;
};

export default function (session: Session<SendersType>) {
    return ({ attackerObjType, attackerIndex, damageType, skillId, targetObjType, targetIndex, targetHp, targetMp, damage }: DamageMessage) => {
        const msg = new Message({ type: _messages.MSG_DAMAGE });

        msg.write('u8', attackerObjType);
        msg.write('i32>', attackerIndex);
        msg.write('u8', damageType);
        msg.write('i32>', skillId);
        msg.write('u8', targetObjType);
        msg.write('i32>', targetIndex);
        msg.write('i32>', targetHp);
        msg.write('i32>', targetMp);
        msg.write('i32>', damage);

        switch (damageType) {
            case 0: // MSG_DAMAGE_MELEE
            case 1: // MSG_DAMAGE_RANGE
            case 2: // MSG_DAMAGE_MAGIC
                msg.write('u8', 5); // m_attackSpeed
                break;
            default:
                msg.write('u8', 0); // m_attackSpeed
                break;
        }

        msg.write('u8', 2) // damage flag: dodge (0), hit (1), critical (2)

        session.write(msg.build());
    }
}
