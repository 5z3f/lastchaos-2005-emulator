import App from '../app';

import Message from '@local/shared/message';
import Session from '@local/shared/session';
import { SendersType } from '.';
import type { Statistic } from '../types';
import _messages from './_messages.json';

const clientHigherThan1107 = App.config.gameserver.clientVersion > 1107;

export type StatusMessage = {
    level: number;
    experience: number;
    maxExperience: number;
    health: number;
    maxHealth: Statistic;
    mana: number;
    maxMana: Statistic;
    strength: Statistic;
    dexterity: Statistic;
    intelligence: Statistic;
    condition: Statistic;
    strengthAdded: number;
    dexterityAdded: number;
    intelligenceAdded: number;
    conditionAdded: number;
    attack: Statistic;
    magicAttack: Statistic;
    defense: Statistic;
    magicResist: Statistic;
    skillpoint: number;
    weight: number;
    maxWeight: number;
    walkSpeed: Statistic;
    runSpeed: Statistic;
    attackSpeed: Statistic;
    magicSpeed?: Statistic;
    pkName: number;
    pkPenalty: number;
    pkCount: number;
    reputation: number;
    attackRange: Statistic;
    meracJoinFlag: number;
    dratanJoinFlag?: number;
    skillSpeed?: Statistic;
    mapAttr: number;
}

export default function (session: Session<SendersType>) {
    return (data: StatusMessage) => {
        const msg = new Message({ type: _messages.MSG_STATUS });

        msg.write('i32>', data.level);                                                              // Level
        msg.write('u64>', data.experience);                                                         // Current Experience
        msg.write('u64>', data.maxExperience);                                                      // Max Experience
        msg.write('i32>', data.health);                                                             // Current Health Points
        msg.write('i32>', data.maxHealth.getTotalValue());                                          // Max Health Points

        if (clientHigherThan1107)
            msg.write('i32>', data.maxHealth.getBaseValue());                                       // Base Health Points

        msg.write('i32>', data.mana);                                                               // Current Mana Points
        msg.write('i32>', data.maxMana.getTotalValue());                                            // Max Mana Points

        if (clientHigherThan1107)
            msg.write('i32>', data.maxMana.getBaseValue());                                         // Base Mana Points

        msg.write('i32>', data.strength.getTotalValue());                                           // Strength
        msg.write('i32>', data.dexterity.getTotalValue());                                          // Dexterity
        msg.write('i32>', data.intelligence.getTotalValue());                                       // Intelligence
        msg.write('i32>', data.condition.getTotalValue());                                          // Condition

        msg.write('i32>', data.strengthAdded);                                                      // Added Strength
        msg.write('i32>', data.dexterityAdded);                                                     // Added Dexterity
        msg.write('i32>', data.intelligenceAdded);                                                  // Added Intelligence
        msg.write('i32>', data.conditionAdded);                                                     // Added Condition

        msg.write('i32>', data.attack.getTotalValue());                                             // Attack

        if (clientHigherThan1107)
            msg.write('i32>', data.attack.getTotalValue());                                         // Added Attack

        msg.write('i32>', data.magicAttack.getTotalValue());                                        // Magic Attack

        if (clientHigherThan1107)
            msg.write('i32>', data.magicAttack.getTotalValue());                                    // Added Magic Attack

        msg.write('i32>', data.defense.getTotalValue());                                            // Defense

        if (clientHigherThan1107)
            msg.write('i32>', data.defense.getTotalValue());                                        // Added Defense

        msg.write('i32>', data.magicResist.getTotalValue());                                        // Magic Resist

        if (clientHigherThan1107)
            msg.write('i32>', data.magicResist.getTotalValue());                                    // Added Magic Resist

        if (clientHigherThan1107) {
            msg.write('i32>', 1);                                                                   // Physical Evasion Rate
            msg.write('i32>', 2);                                                                   // Physical Base Evasion Rate

            msg.write('i32>', 3);                                                                   // Magic Evasion Rate
            msg.write('i32>', 4);                                                                   // Magic Base Evasion Rate

            msg.write('i32>', 5);                                                                   // Hit Rate
            msg.write('i32>', 6);                                                                   // Base Hit Rate

            msg.write('i32>', 7);                                                                   // Magic Hit Rate
            msg.write('i32>', 8);                                                                   // Base Magic Hit Rate

            msg.write('i32>', 9);                                                                   // Critical Rate
            msg.write('i32>', 10);                                                                  // Base Critical Rate

            msg.write('i32>', 11);                                                                  // Deadly Rate
            msg.write('i32>', 12);                                                                  // Base Deadly Rate
        }

        msg.write('i32>', data.skillpoint);                                                         // Skillpoint

        msg.write('i32>', data.weight);                                                             // Weight
        msg.write('i32>', data.maxWeight);                                                          // Max Weight

        msg.write('f<', data.walkSpeed.getTotalValue());                                            // Walk Speed

        msg.write('f<', data.runSpeed.getTotalValue());                                             // Run Speed

        if (clientHigherThan1107)
            msg.write('f<', data.runSpeed.getBaseValue());                                          // Base Run Speed

        msg.write('u8', data.attackSpeed.getTotalValue());                                          // Attack Speed

        if (clientHigherThan1107)
            msg.write('u8', data.attackSpeed.getBaseValue());                                       // Base Attack Speed

        msg.write('u8', data.magicSpeed?.getTotalValue());                                           // Magic Speed (?)

        msg.write('u8', data.pkName);                                                               // PK Name
        msg.write('i32>', data.pkPenalty);                                                          // PK Penalty
        msg.write('i32>', data.pkCount);                                                            // PK Count

        msg.write('i32>', data.reputation);                                                         // Reputation (Fame)
        msg.write('f<', data.attackRange.getTotalValue());                                          // Attack Range
        msg.write('u8', data.meracJoinFlag);                                                        // GetJoinFlag(ZONE_MERAC)

        if (clientHigherThan1107)
            msg.write('u8', data.dratanJoinFlag);                                                   // GetJoinFlag(ZONE_DRATAN)

        msg.write('i32>', data.skillSpeed?.getTotalValue());                                         // Skill Speed
        msg.write('u8', data.mapAttr);                                                              // GetMapAttr()

        // FIXME: to check
        msg.write('u8', 0);                                                                         // sbMountPet
        msg.write('u8', 0);                                                                         // sbPetColor(?)
        msg.write('u8', 0);                                                                         // sbEvocationType
        msg.write('i32>', 0);                                                                       // sbEvocationRemain

        session.write(msg.build());
    }
}
