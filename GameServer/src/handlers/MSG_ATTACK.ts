import log from '@local/shared/logger';
import Message from '@local/shared/message';
import Session from '@local/shared/session';
import game from '../game';
import { GameObjectType } from '../gameobject';
import Character from '../gameobject/character';
import Monster from '../gameobject/monster';
import { SendersType } from '../senders';

export default function (session: Session<SendersType>, msg: Message) {
    const data = {
        attackerObjType: msg.read('u8'),
        attackerIndex: msg.read('i32>'),
        targetObjType: msg.read('u8'),
        targetIndex: msg.read('i32>'),
        attackType: msg.read('u8'),
        multicount: msg.read('u8'),
    };

    log.debug(`[ATTACK] (uid: ${data.attackerIndex} >> uid: ${data.targetIndex})`);

    const character = game.world.find(GameObjectType.Character, (ch) => ch.uid == data.attackerIndex) as Character;
    const monster = game.world.find(GameObjectType.Monster, (m) => m.uid == data.targetIndex) as Monster;

    if (!monster) {
        return console.debug(`monster which doesn't exist has been attacked`);
    }

    monster.attackable.damage(character);
}
