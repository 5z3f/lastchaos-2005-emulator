import game from "../../game";
import { GameObjectType } from "../../gameobject";
import Character, { CharacterRole } from "../../gameobject/character";

export enum ChatType {
    Normal,
    Party,
    Guild,
    Trade,
    Whisper,
    Shout,
    Notice,
    GM,
    Messenger,
    Load,
    Ranker,
    // RankerConn,         // titan class ranked entered
    NoticeServerDown,
    GMWhisper,
    GMSay,
    GMTool,
    NoticePressCorps,

    // FIXME: temporary(?) solution to send custom system messages
    System = -999,
}

export enum ChatColors {
    Normal = 0xCCCCCCFF,                    // Light Gray
    Party = 0x91A7EAFF,                     // Light Blue
    Guild = 0xD6A6D6FF,                     // Light Purple
    Trade = 0x50C800FF,                     // Green
    Whisper = 0xE1B300FF,                   // Orange
    Shout = 0xFF96BEFF,                     // Pink
    Notice = 0xE18600FF,                    // Dark Orange
    Lord = 0xf6f82dFF,                      // Yellow
    Ranker = 0x00EDBDFF,                     // Turquoise
}

export enum Color {
    None = 0,
    IndianRed = 0xCD5C5CFF,
    Maroon = 0x800000FF,
    Olive = 0x808000FF,
    Green = 0x008000FF,
    Purple = 0x800080FF,
    Teal = 0x008080FF,
    Silver = 0xC0C0C0FF,
    Gray = 0x808080FF,
    Orange = 0xFFA500FF,
    Yellow = 0xFFFF00FF,
    Lime = 0x00FF00FF,
    PaleTurquoise = 0xAFEEEEFF,
    Aquamarine = 0x7FFFD4FF,
    Turquoise = 0x40E0D0FF,
    SteelBlue = 0x4682B4FF,
    MediumBlue = 0x0000CDFF,
    BlueViolet = 0x8A2BE2FF,
    DarkViolet = 0x9400D3FF,
    DarkOrchid = 0x9932CCFF,
    DarkMagenta = 0x8B008BFF,
    Indigo = 0x4B0082FF,
    SlateBlue = 0x6A5ACDFF,
    DarkSlateBlue = 0x483D8BFF,
    DarkSlateGray = 0x2F4F4FFF,
    DarkTurquoise = 0x00CED1FF,
    LightSeaGreen = 0x20B2AAFF,
    ForestGreen = 0x228B22FF,
    DarkGreen = 0x006400FF,
    SaddleBrown = 0x8B4513FF,
    Sienna = 0xA0522DFF,
    Chocolate = 0xD2691EFF,
    DarkRed = 0x8B0000FF,
    Firebrick = 0xB22222FF,
    Brown = 0xA52A2AFF,
    DarkSalmon = 0xE9967AFF,
    Salmon = 0xFA8072FF,
    LightSalmon = 0xFFA07AFF,
    Coral = 0xFF7F50FF,
    Tomato = 0xFF6347FF,
    OrangeRed = 0xFF4500FF,
    Red = 0xFF0000FF,
    Pink = 0xFC0FC0FF,
}

const chatTypeConditions = {
    [ChatType.Normal]: (sender: Character, receiver: Character) =>
        sender.zone.id === receiver.zone.id && receiver.distance(sender.position) < 250,
    [ChatType.GM]: (sender: Character, receiver: Character) =>
        receiver.role > Number(CharacterRole.None)
}

type MessageParams = {
    senderCharacter: Character | string;
    receiverCharacter?: Character;
    chatType: Exclude<ChatType, ChatType.System>;
    text: string;
}

export default class Chat {
    owner: Character;

    constructor(owner: Character) {
        this.owner = owner;
    }

    message(chatType: Exclude<ChatType, ChatType.System>, text: string, receiverCharacter?: Character) {
        Chat.message({
            senderCharacter: this.owner,
            chatType,
            receiverCharacter,
            text
        });
    }

    system(text: string, color: Color = Color.Silver) {
        Chat.system(this.owner, text, color);
    }

    /**
     * Sends a message to the player.
     * @param senderCharacter Character who sends the message.
     * @param receiverCharacter Character who receives the message.
     * @param chatType Type of the chat.
     * @param text Message to be sent.
     */
    static message({ senderCharacter, receiverCharacter, chatType, text }: MessageParams) {
        let senderId: number;
        let senderName: string;

        if (typeof senderCharacter === 'string') {
            senderId = -1;
            senderName = senderCharacter;
        } else {
            senderId = (senderCharacter as Character).uid;
            senderName = (senderCharacter as Character).nickname;
        }

        if (receiverCharacter) {
            receiverCharacter.session.send.chat({
                subType: chatType,
                senderId,
                senderName,
                receiverName: receiverCharacter.nickname,
                text,
            });

            return;
        }

        // TODO: this should not be here?
        if (typeof senderCharacter === 'string')
            return;

        const chatTypeConditionsByType = chatTypeConditions[chatType as keyof typeof chatTypeConditions];
        const characters = game.world.filter(GameObjectType.Character, (ch: Character) => chatTypeConditionsByType(senderCharacter, ch)) as Character[];

        for (let ch of characters) {
            ch.session.send.chat({
                subType: chatType,
                senderId,
                senderName,
                receiverName: ch.nickname,
                text,
            });
        }
    }

    /**
     * Sends a system message to the player.
     * @param character Character to send the message to.
     * @param text Message to be sent.
     * @param color Color of the message.
     */
    static system(character: Character, text: string, color: Color = Color.Silver) {
        character.session.send.chat({
            subType: ChatType.System,
            text: text,
            color: color
        });
    }
}
