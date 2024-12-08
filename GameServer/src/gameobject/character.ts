import log from '@local/shared/logger';

import { Buff, BuffOrigin, Buffs } from '../system/core/buff';
import Chat from '../system/core/chat';
import { Inventory, InventoryItem } from '../system/core/inventory';
import Messenger from '../system/core/messenger';
import Quickslot from '../system/core/quickslot';
import { Modifier, ModifierType, Statistic, StatisticEvents } from '../system/core/statistic';
import { Statpoints } from '../system/core/statpoints';

import Session from '@local/shared/session';
import GameObject, { PacketObjectType } from './index';
import Attackable from './traits/attackable';

import { ItemWearingPosition } from '../api/item';
import type { Statistics } from './index';
import { CharacterEvents, GameObjectEvents, GameObjectType } from './index';

import { FriendStatusType } from '../handlers/MSG_FRIEND';
import { SendersType } from '../senders';

export enum CharacterRole {
    None,
    GameSage,
    GameMaster,
    Administrator,
};

export enum ClassType {
    Titan,
    Knight,
    Healer,
    Mage,
    Rogue,
    Sorcerer,
};

type Reward = {
    experience: number,
    skillpoint: number,
    gold: number,
    items: number[],
};

type CharacterOptions = {
    session: Session<SendersType>,
    uid?: number,
    id: number,
    classType: ClassType,
    jobType: number,
    nickname: string,
    appearance: {
        hairType: number,
        faceType: number,
    },
    progress: {
        level: number,
        experience: number,
        maxExperience: number,
        skillpoint: number,
    },
    reward: Reward,
    reputation: number,
    statistics: Statistics,
    statpoints: {
        availablePoints: number,
        strength: number,
        dexterity: number,
        intelligence: number,
        condition: number,
    },
    availableStatpoints: number,
    role: CharacterRole,
};

export default class Character extends GameObject<GameObjectType.Character> {
    session: Session<SendersType>;
    role: CharacterRole;
    nickname: string;
    classType: number;
    jobType: number;
    appearance: {
        hairType: number,
        faceType: number,
    };
    progress: {
        level: number,
        experience: number,
        maxExperience: number,
        skillpoint: number,
    };
    reward: Reward;
    reputation: number;
    pk: {
        name: number,
        penalty: number,
        count: number,
    };
    meracJoinFlag: number;
    mapAttr: number;

    visibleObjectUids: {
        [GameObjectType.Character]: any[],
        [GameObjectType.NPC]: any[],
        [GameObjectType.Monster]: any[],
        [GameObjectType.Item]: any[],
    };

    // traits
    attackable: Attackable;

    // systems
    inventory: Inventory;
    statpoints: Statpoints;
    quickslot: Quickslot;
    buffs: Buffs;
    chat: Chat;
    messenger: Messenger;

    constructor({ session, uid, id, classType, jobType, nickname, appearance, progress, reward, reputation, statistics, statpoints, role }: CharacterOptions) {
        // get all properties from GameObject class
        //@ts-ignore
        super(...arguments);
        this.session = session;

        this.type = GameObjectType.Character;
        this.objType = PacketObjectType.Character;

        // TODO: roles
        this.role = role;
        this.nickname = nickname || '';
        this.classType = classType ?? 0;
        this.jobType = jobType ?? 0;

        this.appearance = {
            hairType: appearance?.hairType || 1,
            faceType: appearance?.faceType || 1
        };

        this.statistics = {
            ...this.statistics,

            //@ts-ignore
            magicSpeed: new Statistic(0),
            skillSpeed: new Statistic(0),
        }

        this.progress = {
            level: progress?.level || 1,
            experience: progress?.experience || 0,
            maxExperience: progress?.maxExperience || 23223182,
            skillpoint: progress?.skillpoint || 10000
        };

        this.reward = {
            experience: reward?.experience || 0,
            skillpoint: reward?.skillpoint || 0,
            gold: reward?.gold || 0,
            items: reward?.items || []
        };

        this.reputation = reputation ?? 0;

        // TODO: pvp system
        this.pk = {
            name: 0,
            penalty: 0,
            count: 0
        };

        // TODO: rename these variables
        this.meracJoinFlag = 0;
        this.mapAttr = 0;

        this.visibleObjectUids = {
            [GameObjectType.Character]: [],
            [GameObjectType.NPC]: [],
            [GameObjectType.Monster]: [],
            [GameObjectType.Item]: []
        }

        // traits
        this.attackable = new Attackable(this);

        // systems
        this.inventory = new Inventory(this);
        this.quickslot = new Quickslot(this);
        this.buffs = new Buffs(this);
        this.chat = new Chat(this);
        this.messenger = new Messenger(this);
        this.statpoints = new Statpoints({
            owner: this,
            availablePoints: statpoints.availablePoints ?? 0,
            strength: statpoints.strength || 0,
            dexterity: statpoints.dexterity || 0,
            intelligence: statpoints.intelligence || 0,
            condition: statpoints.condition || 0
        });

        Object.assign(this.statistics, statistics, this.statistics);

        const baseCharacterStatistics = require('../../data/characters.json')[this.classType].baseStatistics;

        for (const name of Object.keys(baseCharacterStatistics) as (keyof Statistics)[]) {
            if (name === 'health') {
                this.statistics.health = baseCharacterStatistics.health;
                this.statistics.maxHealth = new Statistic(baseCharacterStatistics.health);
            } else if (name === 'mana') {
                this.statistics.mana = baseCharacterStatistics.mana;
                this.statistics.maxMana = new Statistic(baseCharacterStatistics.mana);
            } else {
                this.statistics[name] = new Statistic(baseCharacterStatistics[name]);
            }
        }

        for (const name of Object.keys(baseCharacterStatistics) as (keyof Statistics)[]) {
            if (name === 'health' || name === 'mana')
                continue;

            this.statistics[name].on(StatisticEvents.Change, (statistic) => this.updateStatistics());
        }

        // initialize base stuff
        this.baseEvents();
        this.addBaseBuffs();
        this.wearingItemBuffs();
    }

    dispose() {
        // set my messenger status to offline
        this.messenger.status = FriendStatusType.Offline;

        // remove from zone 
        this.zone.remove(GameObjectType.Character, (ch: Character) => ch.uid === this.uid);

        // run base dispose method
        super.dispose();
    }

    baseEvents() {
        this.on(GameObjectEvents.Heal, (amount) => {
            //
        });

        this.on(CharacterEvents.StatisticUpdate, () => {
            //
        });

        this.on(CharacterEvents.BuffRemove, (buff) => {
            //
        });
    }

    // TODO: buff values here should be treated as base values
    wearingItemBuffs() {
        // value * pow(plusFactor, plus)
        const plusFormula = (staticValue: number, plus: number) =>
            staticValue * Math.pow((plus >= 11) ? 1.07 : 1.06, plus);

        const isArmor = (wearingPosition: number) => {
            return wearingPosition === ItemWearingPosition.Helmet ||
                wearingPosition === ItemWearingPosition.Shirt ||
                wearingPosition === ItemWearingPosition.Pants ||
                wearingPosition === ItemWearingPosition.Shield ||
                wearingPosition === ItemWearingPosition.Gloves ||
                wearingPosition === ItemWearingPosition.Boots;
        }

        const isWeapon = (wearingPosition: number) => {
            return wearingPosition === ItemWearingPosition.Weapon;
        }

        this.on(CharacterEvents.InventoryEquip, (item: InventoryItem) => {
            if (isArmor(item.baseItem.wearingPosition)) {
                const itemDefense = item.baseItem.values[0] ?? 0;
                const itemMagicResist = item.baseItem.values[1] ?? 0;

                const defenseModifier = new Modifier(ModifierType.Additive,
                    /* standard formula */ plusFormula(itemDefense, item.plus) +
                    ///* 10 additional defense */ (item.plus >= 8 ? 10 : 0) +
                    /* max plus bonus */ (item.plus >= 15 ? 100 : 0)
                )

                const magicResistModifier = new Modifier(ModifierType.Additive,
                    /* standard formula */ plusFormula(itemMagicResist, item.plus) +
                    ///* 10 additional magic resist */ (item.plus >= 10 ? 10 : 0) +
                    /* max plus bonus */ (item.plus >= 15 ? 100 : 0)
                )

                const armorBuff = new Buff(this, BuffOrigin.Hardcoding, 'base-armor-' + item.baseItem.wearingPosition, [
                    [this.statistics.defense, defenseModifier],
                    [this.statistics.magicResist, magicResistModifier]
                ]);

                this.buffs.add(armorBuff);
            }
            else if (isWeapon(item.baseItem.wearingPosition)) {
                const itemAttack = item.baseItem.values[0] ?? 0;
                const totalItemAttack = plusFormula(itemAttack, item.plus) + (item.plus >= 15 ? 75 : 0);

                let attackModifier = new Modifier(ModifierType.Additive, totalItemAttack);

                if (this.progress.level < item.baseItem.level) {
                    const levelDiff = item.baseItem.level - this.progress.level;

                    if (levelDiff > 4) {
                        const penaltyInPercent = (levelDiff > 12) ? .90 : (levelDiff > 8) ? .70 : (levelDiff > 4) ? .50 : 0;

                        attackModifier = new Modifier(ModifierType.Negative, (totalItemAttack * penaltyInPercent));
                    }
                }

                const weaponBuff = new Buff(this, BuffOrigin.Hardcoding, 'base-weapon', [
                    [this.statistics.attack, attackModifier]
                ]);

                this.buffs.add(weaponBuff);
            }
        });

        this.on(CharacterEvents.InventoryUnequip, (item) => {
            if (isArmor(item.baseItem.wearingPosition))
                this.buffs.remove(null, BuffOrigin.Hardcoding, 'base-armor-' + item.baseItem.wearingPosition);
            else if (isWeapon(item.baseItem.wearingPosition))
                this.buffs.remove(null, BuffOrigin.Hardcoding, 'base-weapon');
        });
    }

    addVisibleObject(type: GameObjectType, uid: number) {
        const visibleObjectUids = this.visibleObjectUids[type];

        if (!visibleObjectUids.includes(uid))
            visibleObjectUids.push(uid);
    }

    removeVisibleObject(type: GameObjectType, uid: number) {
        const visibleObjectUids = this.visibleObjectUids[type];

        if (visibleObjectUids.includes(uid))
            visibleObjectUids.splice(visibleObjectUids.indexOf(uid), 1);
    }

    getVisibleObjects(type: GameObjectType) {
        return this.visibleObjectUids[type];
    }

    isObjectVisible(type: GameObjectType, uid: number) {
        return this.visibleObjectUids[type].includes(uid);
    }

    addBaseBuffs() {
        // TODO: Will also need to take into account the current total of given statistic
        function calculateBonusHealth(classType: number, level: number, str: number, dex: number, int: number, con: number, multiplier: number) {
            switch (classType) {
                case ClassType.Titan:
                    multiplier = 1.1;
                    break;
                case ClassType.Knight:
                    multiplier = 1.2;
                    break;
                case ClassType.Healer:
                case ClassType.Rogue:
                    multiplier = 0.9;
                    break;
                case ClassType.Mage:
                case ClassType.Sorcerer:
                    multiplier = 0.8;
                    break;
            }

            return Math.floor((con + (str * 0.5) + (dex * 0.2) + (int * 0.1) + (con * 0.7) + (level * 0.9)) * multiplier);
        }

        function calculateBonusMana(classType: number, level: number, str: number, dex: number, int: number, con: number, multiplier: number) {
            switch (classType) {
                case ClassType.Titan:
                    multiplier = 0.4;
                    break;
                case ClassType.Knight:
                    multiplier = 0.6;
                    break;
                case ClassType.Healer:
                case ClassType.Rogue:
                    multiplier = 0.8;
                    break;
                case ClassType.Mage:
                    multiplier = 1.4;
                    break;
                case ClassType.Sorcerer:
                    multiplier = 1.2;
                    break;
            }

            return Math.floor((int + (str * 0.1) + (dex * 0.2) + (int * 0.9) + (con * 0.2) + (level * 1.2)) * multiplier);
        }

        function calculateBonusAttack(classType: number, level: number, str: number, dex: number, int: number, con: number) {
            let bonus = 0;

            switch (classType) {
                case ClassType.Titan:
                    bonus = (str + (str * 1.5) + (dex * 0.1) + (int * 0.1) + (con * 0.6) + (level * 0.3));
                    break;
                case ClassType.Knight:
                    bonus = (str + (str * 1.1) + (dex * 0.4) + (int * 0.1) + (con * 0.3) + (level * 0.5));
                    break;
                case ClassType.Healer:
                    bonus = (dex + (str * 0.5) + (dex * 1.2) + (int * 0.3) + (con * 0.5) + (level * 0.8));
                    break;
                case ClassType.Rogue:
                    bonus = (dex + (str * 0.3) + (dex * 0.9) + (int * 0.1) + (con * 0.3) + (level * 0.4));
                    break;
                case ClassType.Mage:
                    bonus = (int + (str * 0.1) + (dex * 0.3) + (int * 1.4) + (con * 0.1) + (level * 1.2));
                    break;
                case ClassType.Sorcerer:
                    bonus = (int + (str * 0.1) + (dex * 0.3) + (int * 1.2) + (con * 0.4) + (level * 0.9));
                    break;
            }

            return bonus;
        }

        const bonusHealth = calculateBonusHealth(
            this.classType,
            this.progress.level,
            this.statpoints.strength.getTotalValue(),
            this.statpoints.dexterity.getTotalValue(),
            this.statpoints.intelligence.getTotalValue(),
            this.statpoints.condition.getTotalValue(),
            1 // multiplier
        );

        const bonusMana = calculateBonusMana(
            this.classType,
            this.progress.level,
            this.statpoints.strength.getTotalValue(),
            this.statpoints.dexterity.getTotalValue(),
            this.statpoints.intelligence.getTotalValue(),
            this.statpoints.condition.getTotalValue(),
            1 // multiplier
        );

        const bonusAttack = calculateBonusAttack(
            this.classType,
            this.progress.level,
            this.statpoints.strength.getTotalValue(),
            this.statpoints.dexterity.getTotalValue(),
            this.statpoints.intelligence.getTotalValue(),
            this.statpoints.condition.getTotalValue()
        );

        const healthModifier = new Modifier(ModifierType.Additive, bonusHealth);
        const manaModifier = new Modifier(ModifierType.Additive, bonusMana);
        const attackModifier = new Modifier(ModifierType.Additive, bonusAttack);

        const healthBuff = new Buff(this, BuffOrigin.Hardcoding, 'base-health', [
            [this.statistics.maxHealth, healthModifier]
        ]);

        const manaBuff = new Buff(this, BuffOrigin.Hardcoding, 'base-mana', [
            [this.statistics.maxMana, manaModifier]
        ]);

        const attackBuff = new Buff(this, BuffOrigin.Hardcoding, 'base-attack', [
            [this.statistics.attack, attackModifier]
        ]);

        this.buffs.add(healthBuff);
        this.buffs.add(manaBuff);
        this.buffs.add(attackBuff);
    };

    updateStatistics() {
        // TODO: All packet sending related functions should be separated from GameObject classes (I think)
        this.session.send.status({
            ...this.statistics,
            ...this.progress,

            pkName: this.pk.name,
            pkPenalty: this.pk.penalty,
            pkCount: this.pk.count,
            reputation: this.reputation,
            meracJoinFlag: this.meracJoinFlag,
            mapAttr: this.mapAttr,
            weight: 3000,
            maxWeight: 10000,

            strength: this.statpoints.strength,
            dexterity: this.statpoints.dexterity,
            intelligence: this.statpoints.intelligence,
            condition: this.statpoints.condition,

            strengthAdded: this.statpoints.strength.getBaseValue(),
            dexterityAdded: this.statpoints.dexterity.getBaseValue(),
            intelligenceAdded: this.statpoints.intelligence.getBaseValue(),
            conditionAdded: this.statpoints.condition.getBaseValue()
        });

        this.emit(CharacterEvents.StatisticUpdate);
    }

    spawn() {
        log.data(`[INFO] Spawning Character (uid: ${this.uid}, id: ${this.id}, zone: ${this.zone.id})`);

        this.zone.add(GameObjectType.Character, this);

        this.session.send.at({
            uid: this.uid,
            name: this.nickname,
            classType: this.classType,
            jobType: this.jobType,
            hairType: this.appearance.hairType,
            faceType: this.appearance.faceType,
            zoneId: this.zone.id,
            areaId: this.areaId,
            position: this.position
        });

        // send remaining statpoints
        this.session.send.statpoint(0, { points: this.statpoints.availablePoints });

        // TODO: spawnedFirstTime should indicate whether the object spawned for the first time
        this.emit(CharacterEvents.EnterGame, /* spawnedFirstTime */);
    }
}
