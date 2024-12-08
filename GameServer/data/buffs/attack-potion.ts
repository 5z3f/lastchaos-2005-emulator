import api from "../../src/api";
import Character from "../../src/gameobject/character";
import { Modifier, ModifierEffectType, ModifierType } from "../../src/system/core/statistic";

const attackPotionModifier = new Modifier(
    ModifierType.Additive, 100, ModifierEffectType.Instant
);

export default {
    id: 328,
    name: 'Attack Potion',
    description: 'Increases attack by 100 for 5 minutes',
    duration: '5 minutes',
    apply: (character: Character, level: number) => {
        api.chat.system(character, 'You have used an Attack Potion.');

        return [
            [character.statistics.attack, attackPotionModifier]
        ];
    },
    remove: (character: Character) => {
        api.chat.system(character, 'Your Attack Potion has expired.');
    },
}
