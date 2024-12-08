import api from "../../src/api";
import BaseItem from "../../src/baseobject/item";
import Character from "../../src/gameobject/character";
import { Buff } from "../../src/system/core/buff";

// TODO: each of these values should be configurable in the item record, not here
const spells = {
    75: [
        // level, value, duration (seconds)
        [1, 240, 15],
    ],
    76: [
        [1, 500, 15],
    ],
    77: [
        [1, 750, 15],
    ],
    252: [
        [1, 1000, 5],
    ],
    253: [
        [1, 500, 5],
    ]
}

const healthPotion = {
    id: [75, 76, 77, 252, 253], // spell ids that this buff is associated with
    name: 'Health Potion',
    description: 'Recovers X HP over X seconds',
    duration: -1, // we assign this later
    apply: function (character: Character, level: number, buff: Buff) {
        const baseItem = (buff.originRef as BaseItem);

        if (!baseItem)
            return [];

        const spellId = baseItem.values[0];
        if (!spellId)
            return [];

        const spellsByLevel = spells[spellId as keyof typeof spells];
        if (!spellsByLevel)
            return [];

        const spell = spellsByLevel[level - 1];
        if (!spell)
            return [];

        const applicationTime = spell[2] * 1000;
        const totalHealthToAdd = spell[1];
        this.duration = spell[2];

        const tick = 100; // ms
        const ticks = applicationTime / tick;
        const healthPerTick = totalHealthToAdd / ticks;

        for (let i = 0; i < ticks; i++) {
            character.wait(() => {
                character.heal(healthPerTick);
                if (character.statistics.health <= character.statistics.maxHealth.getTotalValue())
                    character.updateStatistics();
            }, i * tick);
        }

        api.chat.system(character, 'You have used a Health Potion.');

        return [];
    },
    remove: (character: Character) => {
        api.chat.system(character, 'Your Health Potion has expired.');
    },
}

export default healthPotion;
