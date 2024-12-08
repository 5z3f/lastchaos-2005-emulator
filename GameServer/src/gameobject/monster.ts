import { Statpoints } from '../system/core/statpoints';
import { Position } from '../types';
import Zone from '../zone';
import Character from './character';
import type { Statistics } from './index';
import GameObject, { GameObjectEvents, GameObjectType, PacketObjectType } from './index';
import Attackable from './traits/attackable';

type Reward = {
    experience: number,
    gold: number,
    items: number[],
};

type MonsterOptions = {
    uid?: number,
    id: number,
    zone: Zone,
    flags: string[],
    level: number,
    statistics: Statistics,
    reward: Reward,
    position: Position,
    respawnTime: number,
    statpoints: {
        strength: number,
        dexterity: number,
        intelligence: number,
        condition: number,
    },
};


export default class Monster extends GameObject<GameObjectType.Monster> {
    level: number;
    reward: Reward;
    respawnTime: number;

    // traits
    attackable: Attackable;

    // systems
    statpoints: Statpoints;

    constructor({ uid, id, zone, flags, level, statistics, reward, position, respawnTime, statpoints }: MonsterOptions) {
        // get all properties from GameObject class
        // @ts-ignore
        super(...arguments);

        this.type = GameObjectType.Monster;
        this.objType = PacketObjectType.NPC;

        this.level = level;

        this.reward = {
            experience: reward?.experience || 0,
            gold: reward?.gold || 0,
            items: reward?.items || [],
        };

        // traits
        this.attackable = new Attackable(this);

        // systems
        this.statpoints = new Statpoints({
            owner: this,
            strength: statpoints.strength || 0,
            dexterity: statpoints.dexterity || 0,
            intelligence: statpoints.intelligence || 0,
            condition: statpoints.condition || 0
        });

        this.respawnTime = /*respawnTime ||*/ 15 * 1000;

        this.testMoveInRange(250);

        Object.assign(this.statistics, statistics, this.statistics);
    }

    appear(character: Character) {
        if (this.state.dead)
            return;

        character.session.send.appear({
            objType: PacketObjectType.NPC,
            uid: this.uid,
            firstAppearance: this.firstAppearance, // TODO:
            id: this.id,
            position: this.position,
            health: this.statistics.health,
            maxHealth: this.statistics.maxHealth.getTotalValue()
        });

        character.addVisibleObject(GameObjectType.Monster, this.uid);

        this.appearCount += 1;

        // TODO: appearedFirstTime should indicate whether the object appeared for the first time
        this.emit(GameObjectEvents.Appear, /* appearedFirstTime */);
    }

    appearInRange(range: number) {
        const characterPoints = this.zone.getObjectsInArea(this.position.x, this.position.y, range)
            .filter(obj => obj.type === 'character');

        for (let obj of characterPoints)
            if (obj.character)
                this.appear(obj.character);
    }

    disappear(character: Character) {
        if (this.state.dead)
            return;

        character.session.send.disappear({
            objType: this.objType,
            uid: this.uid
        });

        character.removeVisibleObject(GameObjectType.Monster, this.uid);

        // TODO: disappearedFirstTime should indicate whether the object disappeared for the first time
        this.emit(GameObjectEvents.Disappear, /* disappearedFirstTime */);
    }

    die() {
        super.die();
        this.wait(() => this.respawn(), this.respawnTime);
        this.emit(GameObjectEvents.Die);
    }
}
