import Character from "../gameobject/character";
import Chat, { ChatType, Color } from "../system/core/chat";

type MessageParams = {
    senderCharacter: Character | string;
    receiverCharacter?: Character;
    chatType: Exclude<ChatType, ChatType.System>;
    text: string;
}

export default class ChatApi {
    /**
     * Sends a message to the player.
     * @param senderCharacter Character who sends the message.
     * @param receiverCharacter Character who receives the message.
     * @param chatType Type of the chat.
     * @param text Message to be sent.
     */
    public static message({ senderCharacter, receiverCharacter, chatType, text }: MessageParams) {
        Chat.message({
            senderCharacter,
            receiverCharacter,
            chatType,
            text
        })
    }

    /**
     * Sends a system message to the player.
     * @param character Character to send the message to.
     * @param text Message to be sent.
     * @param color Color of the message.
     */
    public static system(character: Character, text: string, color: Color = Color.Silver) {
        Chat.system(character, text, color);
    }
}
