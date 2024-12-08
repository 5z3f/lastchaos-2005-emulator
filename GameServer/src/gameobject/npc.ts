
import { Position } from '../types';
import GameObject, { GameObjectEvents, GameObjectType, PacketObjectType } from './index';
import Attackable from './traits/attackable';

import type { Statistics } from './index';

import Session from '@local/shared/session';
import { SendersType } from '../senders';
import { Statpoints } from '../system/core/statpoints';

type Reward = {
    experience: number,
    gold: number,
    items: number[],
};

type NPCOptions = {
    uid?: number,
    id: number,
    level: number,
    statistics: Statistics, // FIXME: need to rethink this
    reward: Reward,
    position: Position,
    statpoints: {
        strength: number,
        dexterity: number,
        intelligence: number,
        condition: number,
    },
};

export default class NPC extends GameObject<GameObjectType.NPC> {
    level: number;
    reward: Reward;

    // traits
    attackable: Attackable;

    // systems
    statpoints: Statpoints;

    constructor({ uid, id, level, statistics, statpoints, reward, position }: NPCOptions) {
        // get all properties from GameObject class
        // @ts-ignore
        super(...arguments);

        this.type = GameObjectType.NPC;
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

        Object.assign(this.statistics, statistics, this.statistics);
    }

    appear(session: Session<SendersType>) {
        session.send.appear({
            objType: PacketObjectType.NPC,
            uid: this.uid,
            firstAppearance: this.firstAppearance,
            id: this.id,
            position: this.position,
            health: this.statistics.health,
            maxHealth: this.statistics.maxHealth.getTotalValue(),
        });

        // TODO: appearedFirstTime should indicate whether the object appeared for the first time
        this.emit(GameObjectEvents.Appear, /* appearedFirstTime */);
    }

    disappear(session: Session<SendersType>) {
        session.send.disappear({
            objType: this.objType,
            uid: this.uid
        });

        // TODO: disappearedFirstTime should indicate whether the object disappeared for the first time
        this.emit(GameObjectEvents.Disappear, /* disappearedFirstTime */);
    }

    update({ session, type, data }: { session: Session<SendersType>, type: string, data: any }) {
        if (type === 'position') {
            Object.assign(this.position, data);

            session.send.move({
                objType: this.objType,
                uid: this.uid,
                moveType: 1, // TODO
                speed: this.statistics.runSpeed.getTotalValue(),
                position: this.position,
                attribute: 0, // TODO
            })

            this.emit(GameObjectEvents.Move, data);
        }
    };
}
