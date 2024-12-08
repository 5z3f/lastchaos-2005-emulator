import Message from '@local/shared/message';
import Session from '@local/shared/session';
import api from '../api';
import game from '../game';
import { GameObjectType } from '../gameobject';
import Character from '../gameobject/character';
import { SendersType } from '../senders';

export default async function (session: Session<SendersType>, msg: Message) {
    const data = {
        chatType: msg.read('u8'),
        senderId: msg.read('i32>'),
        senderName: msg.read('stringnt'),
        receiverName: msg.read('stringnt'),
        text: msg.read('stringnt'),
    };

    const character = session.character!;
    if (data.senderId != character.uid || data.senderName != character.nickname) {
        // TODO: log this
        return;
    }

    const senderCharacter = game.world.find(GameObjectType.Character, (ch: Character) => ch.uid === data.senderId);
    const receiverCharacter = game.world.find(GameObjectType.Character, (ch: Character) => ch.nickname === data.receiverName);

    api.chat.message({
        chatType: data.chatType,
        senderCharacter,
        receiverCharacter,
        text: data.text,
    })
}
