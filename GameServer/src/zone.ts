import { Box, Point, QuadTree } from 'js-quadtree';

import fs from 'fs';
import path from 'path';
import { SmartBuffer } from 'smart-buffer';

import Monster from './gameobject/monster';
import NPC from './gameobject/npc';

import game from './game';
import { GameObjectType } from './gameobject';
import Character from './gameobject/character';
import { Statistic } from './system/core/statistic';
import { Position } from './types';
import { ZoneType } from './world';

class GamePoint extends Point {
    uid?: number;
    type?: string;
    character?: Character;
}

export enum AttributeFlags {
    FIELD = 0,
    PEACEZONE = 10,
    PRODUCT_PUBLIC = 20,
    PRODUCT_PRIVATE = 30,
    STAIR_UP = 40,
    STAIR_DOWN = 50,
    WARZONE = 60,
    FREEPKZONE = 70,
    BLOCK = 255,
};

export default class Zone {
    npcs: NPC[] = [];
    monsters: Monster[] = [];
    characters: Character[] = [];
    items = []; // on ground

    id: ZoneType;
    width: number;
    height: number;

    attributeMap: number[][] = [];
    heightMap: number[][] = [];

    quadTree: QuadTree;

    constructor(id: ZoneType, width: number, height: number) {
        this.id = id;

        this.width = width;
        this.height = height;

        this.attributeMap = Array.from(Array(width), e => Array(height));
        this.heightMap = Array.from(Array(width), e => Array(height));

        const box = new Box(0, 0, width, height);
        this.quadTree = new QuadTree(box, {
            capacity: 64,
            arePointsEqual: (p1: GamePoint, p2: GamePoint) => {
                return (p1.uid === p2.uid && p1.x === p2.x && p1.y === p2.y);
            },
        });

        this.load();
    }

    load() {
        for (let baseMonster of game.content.monsters) {
            for (let spawn of baseMonster.spawns) {
                if (spawn.zoneId != this.id)
                    continue;

                const monster = new Monster({
                    id: baseMonster.id,
                    flags: baseMonster.flags,
                    level: baseMonster.level,
                    zone: this,
                    //@ts-ignore
                    position: spawn.position,
                    respawnTime: spawn.respawnTime * 1000,
                    //@ts-ignore
                    statistics: {
                        health: baseMonster.statistics.health,
                        maxHealth: new Statistic(baseMonster.statistics.health),
                        mana: baseMonster.statistics.mana,
                        maxMana: new Statistic(baseMonster.statistics.mana),
                        attack: new Statistic(baseMonster.statistics.attack),
                        magicAttack: new Statistic(baseMonster.statistics.magicAttack),
                        defense: new Statistic(baseMonster.statistics.defense),
                        magicResist: new Statistic(baseMonster.statistics.magicResist),
                        walkSpeed: new Statistic(baseMonster.statistics.walkSpeed),
                        runSpeed: new Statistic(baseMonster.statistics.runSpeed),
                        attackRange: new Statistic(baseMonster.statistics.attackRange),
                        attackSpeed: new Statistic(baseMonster.statistics.attackSpeed),
                    },
                    statpoints: {
                        strength: baseMonster.statistics.strength,
                        dexterity: baseMonster.statistics.dexterity,
                        intelligence: baseMonster.statistics.intelligence,
                        condition: baseMonster.statistics.condition,
                    },
                });

                this.add(GameObjectType.Monster, monster);
            }
        }

        for (let baseNPC of game.content.npcs) {
            for (let spawn of baseNPC.spawns) {
                if (spawn.zoneId != this.id)
                    continue;

                const n = new NPC({
                    id: baseNPC.id,
                    zone: this,
                    flags: baseNPC.flags,
                    level: baseNPC.level,
                    statistics: {
                        health: baseNPC.statistics.health,
                        //@ts-ignore
                        maxHealth: new Statistic(baseNPC.statistics.health),
                        healthRegen: new Statistic(0), // TODO: delete this later
                        mana: baseNPC.statistics.mana,
                        maxMana: new Statistic(baseNPC.statistics.mana),
                        manaRegen: new Statistic(0), // TODO: delete this later
                        attack: new Statistic(baseNPC.statistics.attack),
                        magicAttack: new Statistic(baseNPC.statistics.magicAttack),
                        defense: new Statistic(baseNPC.statistics.defense),
                        magicResist: new Statistic(baseNPC.statistics.magicResist),
                        walkSpeed: new Statistic(baseNPC.statistics.walkSpeed),
                        runSpeed: new Statistic(baseNPC.statistics.runSpeed),
                        attackRange: new Statistic(baseNPC.statistics.attackRange),
                        attackSpeed: new Statistic(baseNPC.statistics.attackSpeed),
                    },
                    statpoints: {
                        strength: baseNPC.statistics.strength,
                        dexterity: baseNPC.statistics.dexterity,
                        intelligence: baseNPC.statistics.intelligence,
                        condition: baseNPC.statistics.condition,
                    },
                    //@ts-ignore
                    position: spawn.position,
                });

                this.add(GameObjectType.NPC, n);
            }
        }

        // read height map
        const heightData = fs.readFileSync(path.dirname(__filename) + `/../data/maps/${this.id}.sht`);
        const reader1 = SmartBuffer.fromBuffer(heightData);

        for (let h = 0; h < this.height; h++)
            for (let w = 0; w < this.width; w++)
                this.heightMap[w]![h]! = reader1.readUInt16BE() / 100.0;

        // read attribute map
        const attrData = fs.readFileSync(path.dirname(__filename) + `/../data/maps/${this.id}.sat`);
        const reader2 = SmartBuffer.fromBuffer(attrData);

        for (let h = 0; h < this.height; h++) {
            for (let w = 0; w < this.width; w++) {
                const val = reader2.readUInt8();
                this.attributeMap[w]![h]! = (val === 0 || val in AttributeFlags) ? val : AttributeFlags.BLOCK;
            }
        }
    }

    getObjectsInArea(x: number, y: number, range: number) {
        x -= Math.floor(range / 2);
        y -= Math.floor(range / 2);

        const box = new Box(x, y, range, range);
        return this.quadTree.query(box) as GamePoint[];
    }

    private getGameObjectsByType(type: GameObjectType) {
        switch (type) {
            case GameObjectType.Character:
                return this.characters;
            case GameObjectType.NPC:
                return this.npcs;
            case GameObjectType.Monster:
                return this.monsters;
            case GameObjectType.Item: // Not an actual game object atm (just a data structure) (TODO: make it an actual game object)
                return this.items;
        }
    }

    add(type: GameObjectType, data: any) {
        if (!('uid' in data))
            return;

        const gameobjects = this.getGameObjectsByType(type);

        if (gameobjects.find((item: any) => item.uid == data.uid))
            return;

        this.quadTree.insert({
            x: data.position.x,
            y: data.position.y,
            // @ts-ignore
            uid: data.uid,
            type: type,
            character: (type === GameObjectType.Character) ? data : undefined
        });

        gameobjects.push(data);
    }

    find(type: GameObjectType, opts: any) {
        return this.getGameObjectsByType(type).find(opts);
    }

    filter(type: GameObjectType, opts: any) {
        return this.getGameObjectsByType(type).filter(opts);
    }

    // TODO: this is not the best way, but sufficient for now
    remove(type: GameObjectType, opts: any) {
        switch (type) {
            case GameObjectType.Character:
                this.characters = this.characters.filter(c => !opts(c));
                break;
            case GameObjectType.NPC:
                this.npcs = this.npcs.filter(n => !opts(n));
                break;
            case GameObjectType.Monster:
                this.monsters = this.monsters.filter(m => !opts(m));
                break;
            case GameObjectType.Item:
                this.items = this.items.filter(i => !opts(i));
                break;
        }
    }

    getAttribute(position: Position, asText: boolean = false) {
        const x = Math.round(position.x);
        const y = Math.round(position.y);

        if (x < 0 || x >= this.width || y < 0 || y >= this.height)
            return asText ? AttributeFlags[AttributeFlags.BLOCK] : AttributeFlags.BLOCK;

        const attribute = this.attributeMap[x]![y]!;

        if (!asText)
            return attribute;

        return AttributeFlags[attribute];
    }

    getHeight(position: Position) {
        const x = Math.round(position.x);
        const y = Math.round(position.y);

        if (x < 0 || x >= this.width || y < 0 || y >= this.height)
            return 0;

        return this.heightMap[x]![y]!;
    }
}
