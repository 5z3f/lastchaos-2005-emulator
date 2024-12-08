import log from "@local/shared/logger";
import type { MessageDamageType } from "../../senders/damage";
import Character from "../character";
import Monster from "../monster";
import NPC from "../npc";

export default class Attackable {
    owner;

    constructor(owner: Character | Monster | NPC) {
        this.owner = owner;
    }

    damage(attacker: Character) {
        const owner = this.owner;
        owner.statistics.health -= attacker.statistics.attack.getTotalValue();
        attacker.statistics.health -= owner.statistics.attack.getTotalValue();

        log.debug(`[ATTACK] ${attacker.type}(${attacker.uid}) [HP: ${attacker.statistics.health} | MP: ${attacker.statistics.mana} | DMG: ${attacker.statistics.attack.getTotalValue()}] attacked ${owner.type}(${owner.uid}) [HP: ${owner.statistics.health} | MP: ${owner.statistics.mana}]`);

        // damage attacker's target
        attacker.session.send.damage({
            attackerObjType: 0,
            attackerIndex: attacker.uid,
            damageType: 3 as MessageDamageType, // ?
            skillId: -1,
            targetObjType: 1,
            targetIndex: owner.uid,
            targetHp: owner.statistics.health,
            targetMp: owner.statistics.mana,
            damage: attacker.statistics.attack.getTotalValue(),
        });

        owner.lastAttackTime = performance.now();

        if (owner.statistics.health <= 0) {
            owner.statistics.health = 0

            // kill monster
            owner.die();

            // remove object from attacker's visible list
            //@ts-ignore
            attacker.removeVisibleObject(owner.type, owner.uid);
        }

        // damage attacker
        attacker.session.send.damage({
            attackerObjType: 1,
            attackerIndex: owner.uid,
            damageType: 0,
            skillId: -1,
            targetObjType: 0,
            targetIndex: attacker.uid,
            targetHp: attacker.statistics.health,
            targetMp: attacker.statistics.mana,
            damage: owner.statistics.attack.getTotalValue(),
        });

        if (attacker.statistics.health <= 0) {
            attacker.statistics.health = 0;
        }
    }
}
