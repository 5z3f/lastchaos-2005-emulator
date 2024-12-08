import Character from "../../gameobject/character";
import Monster from "../../gameobject/monster";
import NPC from "../../gameobject/npc";
import { Statistic } from "../../types";

export enum StatpointType {
    Strength,
    Dexterity,
    Intelligence,
    Condition,
}

type StatpointOptions = {
    owner: Character | Monster | NPC,
    availablePoints?: number
    strength: number,
    dexterity: number,
    intelligence: number,
    condition: number,
}

export class Statpoints {
    owner: Character | Monster | NPC;
    availablePoints: number;

    strength: Statistic;
    dexterity: Statistic;
    intelligence: Statistic;
    condition: Statistic;

    constructor({ owner, availablePoints, strength, dexterity, intelligence, condition }: StatpointOptions) {
        this.owner = owner;
        this.availablePoints = availablePoints ?? 0;

        this.strength = new Statistic(strength);
        this.dexterity = new Statistic(dexterity);
        this.intelligence = new Statistic(intelligence);
        this.condition = new Statistic(condition);
    }

    add(statpointType: StatpointType, amount: number): void {
        if (amount > this.availablePoints) {
            // TODO: handle error
            return;
        }

        switch (statpointType) {
            case StatpointType.Strength:
                this.strength.setBaseValue(this.strength.getBaseValue() + amount);
                break;
            case StatpointType.Dexterity:
                this.dexterity.setBaseValue(this.dexterity.getBaseValue() + amount);
                break;
            case StatpointType.Intelligence:
                this.intelligence.setBaseValue(this.intelligence.getBaseValue() + amount);
                break;
            case StatpointType.Condition:
                this.condition.setBaseValue(this.condition.getBaseValue() + amount);
                break;
        }
    }
}
