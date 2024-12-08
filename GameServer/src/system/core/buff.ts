import * as buffScripts from '../../../data/buffs';
import BaseItem from "../../baseobject/item";
import EventEmitter from "../../events";
import { CharacterEvents } from "../../gameobject";
import Character from "../../gameobject/character";
import { EffectMessageType } from "../../senders/effect";
import { Color } from "../../system/core/chat";
import { durationToSeconds } from '../../util';
import { Modifier, Statistic } from "./statistic";

export const LCTIME_MULTIPLIER = 10;

export enum BuffEvents {
    Apply = 'buff:apply',
    Remove = 'buff:remove',
}

export enum BuffOrigin {
    Hardcoding = -1,
    Command,
    Item,
    Skill,
    NPC,
    Monster,
    Quest,
}

export type ModifiedStatistic = [Statistic, Modifier];

function getBuffScript(spellId: number) {
    // iterate over all buff scripts
    for (const buffName in buffScripts) {
        const buffScript = buffScripts[buffName as keyof typeof buffScripts];

        if ((Array.isArray(buffScript.id) ? buffScript.id.includes(spellId) : buffScript.id === spellId))
            return buffScript;
    }
}

interface BuffScript {
    id: number;
    name: string;
    description: string;
    duration: string;
    levels: number;
    apply: (character: Character, level: number, buff: Buff) => [[Statistic, Modifier]];
    remove: (character: Character) => void;
}

export class Buff extends EventEmitter<BuffEvents> {
    owner: Character;
    originType: BuffOrigin;
    originRef: BaseItem | string;
    modifiedStatistics: ModifiedStatistic[];
    duration?: number;
    timeoutId?: NodeJS.Timeout;
    script?: BuffScript;

    constructor(owner: Character, originType: BuffOrigin, originRef: string | BaseItem, modifiedStatistics?: ModifiedStatistic[], duration: number | string | undefined = undefined, script?: BuffScript) {
        super();

        this.owner = owner;
        this.duration = (typeof duration === 'string') ? durationToSeconds(duration)
            : (typeof duration === 'number') ? duration : duration;

        this.modifiedStatistics = modifiedStatistics || [];
        this.originType = originType;
        this.originRef = originRef;
        this.script = script;
    }

    static fromItem(owner: Character, baseItem: BaseItem): Buff | undefined {
        // FIXME: check if baseItem is usable and has POTION flag
        const spellId = baseItem.values[0];
        if (!spellId)
            return;

        // search for buff script with given index
        const buffScript = getBuffScript(spellId);
        if (!buffScript)
            return;

        return new this(
            owner,
            BuffOrigin.Item,
            baseItem,
            undefined,
            buffScript.duration,
            // @ts-ignore TODO: fix type
            buffScript,
        );
    }

    apply() {
        if (this.script) {
            if (this.originType === BuffOrigin.Item) {
                const baseItem = this.originRef as BaseItem;
                const spellLevel = baseItem.values[1]!;

                // run custom logic from script
                this.modifiedStatistics = this.script.apply(this.owner, spellLevel, this);

                // since we can modify duration in script, we need to update it here as well
                this.duration = (typeof this.script.duration === 'string') ? durationToSeconds(this.script.duration)
                    : (typeof this.script.duration === 'number') ? this.script.duration : this.script.duration;
            }
        };

        this.modifiedStatistics.forEach((modifiedStat) => {
            modifiedStat[1] = modifiedStat[1].clone();
            modifiedStat[0].addModifier(modifiedStat[1]);
        });

        if (this.duration) {
            const that = this;
            this.timeoutId = this.owner.wait(() => {
                that.owner.buffs.remove(that);
                that.owner.emit(CharacterEvents.BuffRemove, that);
            }, this.duration * 1000);
        }

        // TODO: spell buffs
        if (this.originType === BuffOrigin.Item) {
            const baseItem = this.originRef as BaseItem;

            this.owner.session.send.assist(0, {
                objType: this.owner.objType,
                objIndex: this.owner.uid,
                itemIndex: baseItem.id,
                skillIndex: baseItem.values[0]!,
                skillLevel: baseItem.values[1],
                remainTime: ((this.duration || 0) + 1) * LCTIME_MULTIPLIER,
            });

            this.owner.session.send.effect({
                subType: EffectMessageType.Item,
                objType: this.owner.objType,
                charUid: this.owner.uid,
                itemId: baseItem.id,
            });
        }

        this.owner.emit(CharacterEvents.BuffApply, this);
    }

    remove() {
        clearTimeout(this.timeoutId);

        this.modifiedStatistics.forEach(([statistic, modifier]) => {
            statistic.removeModifier(modifier);
        });

        if (this.originType === BuffOrigin.Item) {
            const baseItem = this.originRef as BaseItem;
            const spellIndex = baseItem.values[0]!;

            // search for buff script with given index
            const buffScript = getBuffScript(spellIndex);

            // hook called after buff is removed for custom logic
            buffScript?.remove(this.owner);

            // TODO: spell buffs
            this.owner.session.send.assist(1, {
                objType: this.owner.objType,
                objIndex: this.owner.uid,
                itemIndex: baseItem.id,
                skillIndex: spellIndex,
            });
        }
    }
}

export class Buffs {
    owner: Character;
    buffs: Buff[];

    constructor(owner: Character) {
        this.owner = owner;
        this.buffs = [];
    }

    add(buff: Buff) {
        const existingBuff = this.find(buff.originType, buff.originRef);

        if (existingBuff) {
            this.owner.chat.system('You already have this buff applied.', Color.IndianRed);
            //this.remove(existingBuff);
            return false;
        }

        this.buffs.push(buff);
        buff.apply();

        return true;
    }

    remove(buff: Buff | number | null, originType?: BuffOrigin, originRef?: string | BaseItem) {
        const isBuffClass = buff instanceof Buff;
        if (!isBuffClass) {
            if (originType === undefined || originRef === undefined)
                return;

            const foundBuff = this.find(originType, originRef);
            if (!foundBuff)
                return;

            buff = foundBuff;
        }

        (buff as Buff).remove();
        this.buffs.splice(this.buffs.indexOf((buff as Buff)), 1);
    }

    find(originType: BuffOrigin, originRef: string | BaseItem) {
        return this.buffs.find(b => b.originType === originType &&
            (typeof originRef === 'string' ? b.originRef === originRef : (b.originRef as BaseItem).id === originRef.id));
    }
}
