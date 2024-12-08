import type { PositionProps } from '../types/position';
import BaseObject from './index';

type NPCOptions = {
    id: number,
    name: string,
    description: string,
    enabled: boolean,
    flags: number,
    level: number,
    vision: number,
    attackType: number,
    spawns: Spawn[],
    statistics: number[],
    skills: number[],
    reward: {
        experience: number,
        skillpoint: number,
        gold: number,
        items: number[],
    },
};

type Spawn = {
    zoneId: number,
    position: PositionProps,
    respawnTime: number,
};

export default class BaseNPC extends BaseObject {

    vision: number;
    attackType: number;
    spawns: Spawn[];
    statistics: {
        health: number,
        mana: number,
        strength: number,
        dexterity: number,
        intelligence: number,
        condition: number,
        attack: number,
        magicAttack: number,
        defense: number,
        magicResist: number,
        walkSpeed: number,
        runSpeed: number,
        attackRange: number,
        attackSpeed: number,
    };

    skills: number[];

    reward: {
        experience: number,
        skillpoint: number,
        gold: number,
        items: number[],
    };

    constructor({ id, name, description, enabled, flags, level, vision, attackType, spawns, statistics, skills, reward }: NPCOptions) {

        // @ts-ignore
        super(...arguments)

        this.level = level;
        this.vision = vision; // currently unused

        this.attackType = attackType; // melee, range or magic (0, 1, 2)

        this.statistics = {
            health: 0,
            mana: 0,
            strength: 0,
            dexterity: 0,
            intelligence: 0,
            condition: 0,
            attack: 0,
            magicAttack: 0,
            defense: 0,
            magicResist: 0,
            walkSpeed: 0,
            runSpeed: 0,
            attackRange: 0,
            attackSpeed: 0,
        };

        this.spawns = spawns;

        // [{ id, level, chance (in percent) }]
        this.skills = skills;

        this.reward = {
            experience: reward?.experience || 0,
            skillpoint: reward?.skillpoint || 0,
            gold: reward?.gold || 0,
            items: reward?.items || []
        };

        Object.assign(this.statistics, statistics, this.statistics);
        Object.assign(this.reward, reward, this.reward);
    }
}
