import log from '@local/shared/logger';
import App from '../app';
import EventEmitter from '../events';
import { Statistic } from '../system/core/statistic';
import Position from '../types/position';
import { createSessionId, getRandomInt } from '../util';
import Zone from '../zone';

export enum GameObjectEvents {
    Appear = 'gameobject:appear',
    Disappear = 'gameobject:disappear',
    Move = 'gameobject:move',
    Respawn = 'gameobject:respawn',
    Heal = 'gameobject:heal',
    Die = 'gameobject:die',
};

export enum CharacterEvents {
    InventoryEquip = 'inventory:equip',
    InventoryUnequip = 'inventory:unequip',
    InventorySwap = 'inventory:swap',
    InventoryAdd = 'inventory:add',
    EnterGame = 'game:enter',
    StatisticUpdate = 'statistic:update',
    BuffApply = 'buff:apply',
    BuffRemove = 'buff:remove',
};

export enum PacketObjectType {
    Character,
    NPC,
};

export enum MonsterEvents {
    // dummy event for now
    dummy = 'dummy',
};

export enum GameObjectType {
    Character = 'Character',
    Monster = 'Monster',
    NPC = 'NPC',
    Item = 'Item', // ?
};

type Events<T> = T extends GameObjectType.Character ? CharacterEvents :
    T extends GameObjectType.Monster ? MonsterEvents :
    GameObjectEvents;

export type Statistics = {
    health: number,
    maxHealth: Statistic,
    healthRegen: Statistic,

    mana: number,
    maxMana: Statistic,
    manaRegen: Statistic,

    attack: Statistic,
    magicAttack: Statistic,

    defense: Statistic,
    magicResist: Statistic,

    walkSpeed: Statistic,
    runSpeed: Statistic,
    attackRange: Statistic,
    attackSpeed: Statistic,
}

type GameObjectOptions = {
    uid?: number,
    id: number,
    flags: string[],
    zone: Zone,
    position?: Position,
    areaId: number,
};

export default class GameObject<T extends GameObjectType> extends EventEmitter<Events<T> | GameObjectEvents> {
    uid: number;
    id: number;
    flags: string[];
    zone: Zone;
    areaId: number;

    position: Position;
    previousPosition: Position;
    originalPosition: Position;

    appearCount: number;
    resurrectionCount: number;
    firstAppearance: boolean;

    state: {
        dead: boolean,
        inCombat: () => boolean,
    };

    lastAttackTime: number;

    statistics: {
        health: number,
        maxHealth: Statistic,
        healthRegen: Statistic,
        mana: number,
        maxMana: Statistic,
        manaRegen: Statistic,
        attack: Statistic,
        magicAttack: Statistic,
        defense: Statistic,
        magicResist: Statistic,
        walkSpeed: Statistic,
        runSpeed: Statistic,
        attackRange: Statistic,
        attackSpeed: Statistic,
    };

    type!: T;
    respawnCount: number = 0;
    objType!: PacketObjectType;

    // we need to store all timeouts/intervals to clear them when object is disposed
    timeoutIds: NodeJS.Timeout[];
    intervalIds: NodeJS.Timeout[];

    constructor({ uid, id, flags, zone, position, areaId }: GameObjectOptions) {
        super();

        this.timeoutIds = [];
        this.intervalIds = [];

        this.uid = uid || createSessionId();   // unique id
        this.id = id;

        this.flags = flags;

        this.position = Position.from(position || { x: 0, y: 0 });
        this.previousPosition = this.position.clone();
        this.originalPosition = this.position.clone();

        this.zone = zone;
        this.areaId = areaId;

        //this.visibleToSomeone = false;

        this.appearCount = 0;
        this.resurrectionCount = 0;

        this.firstAppearance = (this.appearCount === 0);

        this.state = {
            dead: false,
            inCombat: () => (performance.now() - this.lastAttackTime < 10000),
        }

        this.lastAttackTime = 0;

        //@ts-ignore
        this.statistics = {
            health: 0,
            maxHealth: new Statistic(),
            healthRegen: new Statistic(),
            mana: 0,
            maxMana: new Statistic(),
            manaRegen: new Statistic(),
            attack: new Statistic(),
            magicAttack: new Statistic(),
            defense: new Statistic(),
            magicResist: new Statistic(),
            walkSpeed: new Statistic(),
            runSpeed: new Statistic(),
            attackRange: new Statistic(),
            attackSpeed: new Statistic(),
        };

        this.startRegen();
    }

    wait(callback: () => void, duration: number) {
        const timeoutId = setTimeout(callback, duration);
        this.timeoutIds.push(timeoutId);
        return timeoutId;
    }

    interval(callback: () => void, duration: number) {
        const intervalId = setInterval(callback, duration);
        this.intervalIds.push(intervalId);
        return intervalId;
    }

    dispose() {
        this.timeoutIds.forEach((id) => clearTimeout(id));
        this.intervalIds.forEach((id) => clearTimeout(id));
    }

    die() {
        this.state.dead = true;
    }

    respawn() {
        this.statistics.health = this.statistics.maxHealth.getTotalValue();
        this.state.dead = false;

        this.respawnCount += 1;

        // temporary
        log.debug(`RESPAWNED UID: ${this.uid}`);

        //@ts-ignore
        this?.appearInRange?.(50);

        this.emit(GameObjectEvents.Respawn);
    }

    hasFlag = (flag: string) =>
        this.flags.includes(flag);

    canMove = () =>
        !this.state.dead && !this.state.inCombat() && this.hasFlag('MOVING');

    distance = (position: Position) =>
        Math.sqrt(Math.pow(position.x - this.position.x, 2) + Math.pow(position.y - this.position.y, 2));

    updatePosition(position: Position, moveType = 1) {
        // previous position
        this.previousPosition = this.position.clone();

        // update current position
        this.position = position;

        // remove previous position
        this.zone.quadTree.remove({
            x: this.previousPosition.x,
            y: this.previousPosition.y,
            //@ts-ignore
            uid: this.uid,
        });

        // insert updated position
        const qtPointObj: any = {
            x: this.position.x,
            y: this.position.y,
            uid: this.uid,
            type: this.type,
        }

        if (this.type === GameObjectType.Character)
            qtPointObj.character = this;

        this.zone.quadTree.insert(qtPointObj);

        this.emit(GameObjectEvents.Move, this.position);

        // FIXME: make it suitable for character class
        if (this.type == GameObjectType.Character) {
            log.debug(`[MOVE] UID: ${this.uid} | (${this.previousPosition.toString()}, ${this.zone.getAttribute(this.previousPosition, true)}) --> (${this.position.toString()}, ${this.zone.getAttribute(this.position, true)})`)
            return;
        }

        App.game.sendInArea(this.zone, this.position, 'move', {
            objType: this.objType,
            uid: this.uid,
            moveType: moveType,
            speed: !!moveType ? this.statistics.runSpeed.getTotalValue() : this.statistics.walkSpeed.getTotalValue(),
            position: this.position
        });
    };

    regenInterval?: NodeJS.Timer = undefined;
    startRegen() {
        const regenTick = 1 * 5000;

        this.regenInterval = setInterval(() => {
            const regenAmount = this.statistics.healthRegen.getTotalValue();
            // this.heal(regenAmount);
        }, regenTick);
    }

    heal(amount: number) {
        if (!amount || this.state.dead || this.statistics.health > this.statistics.maxHealth.getTotalValue())
            return;

        const currentHealth = this.statistics.health;
        const maxHealth = this.statistics.maxHealth.getTotalValue();

        const newHealth = Math.min(currentHealth + amount, maxHealth);
        const healthDiff = newHealth - currentHealth;

        if (!healthDiff)
            return;

        this.statistics.health = newHealth;

        this.emit(GameObjectEvents.Heal, amount);
    }

    move(range: number) {
        const randomMoveType = getRandomInt(0, 2);

        if (!this.canMove())
            return;

        let newPosition = this.originalPosition.getRandomWithinRange(range);
        newPosition.z = this.zone.getHeight(newPosition);

        let posAttr = this.zone.getAttribute(newPosition);

        while (posAttr == 255 /* BLOCK */) {
            newPosition = this.originalPosition.getRandomWithinRange(range);
            newPosition.z = this.zone.getHeight(newPosition);
            posAttr = this.zone.getAttribute(newPosition);
        }

        this.updatePosition(newPosition, randomMoveType);
    }

    testMoveInRange(range: number) {
        // if object has MOVING flag, then it can move
        if (!this.hasFlag('MOVING'))
            return;

        range = 50;
        const randomMovementTick = getRandomInt(3, 15) * 1000;

        setInterval(function (that) { that.move(range) }, randomMovementTick, this);
    }
}
