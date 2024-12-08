import BaseItem from './baseobject/item';
import BaseMonster from './baseobject/monster';
import BaseNPC from './baseobject/npc';

import log from '@local/shared/logger';
import * as buffScripts from '../data/buffs';

export enum ContentType {
    Item,
    Monster,
    NPC,
};

export default class Content {
    items: BaseItem[] = [];
    monsters: BaseMonster[] = [];
    npcs: BaseNPC[] = [];

    // FIXME: replace any with new BuffScript/BaseBuff class (?)
    buffs: any[] = [];

    constructor() {
        this.load(ContentType.Item, '../data/items.json');
        log.info(`Loaded ${this.items.length} items`);

        this.load(ContentType.Monster, '../data/monsters.json');
        log.info(`Loaded ${this.monsters.length} monsters`);

        this.load(ContentType.NPC, '../data/npcs.json');
        log.info(`Loaded ${this.npcs.length} npcs`);

        this.loadBuffScripts();
        log.info(`Loaded ${this.buffs.length} buff scripts`);
    }

    load(type: ContentType, fp: string) {
        const objs = require(fp);

        for (const o of objs) {
            if (!o.enabled)
                continue;

            if (o.name.length < 1 /*|| o.description.length < 1*/)
                continue;

            switch (type) {
                case ContentType.Item:
                    this.items.push(new BaseItem(o));
                    break;
                case ContentType.Monster:
                    this.monsters.push(new BaseMonster(o));
                    break;
                case ContentType.NPC:
                    this.npcs.push(new BaseNPC(o));
                    break;
            }
        }
    }

    loadBuffScripts() {
        for (const buffId in buffScripts) {
            const buffScript = buffScripts[buffId as keyof typeof buffScripts];
            this.buffs.push(buffScript);
        }
    }

    find(type: ContentType, opts: any) {
        switch (type) {
            case ContentType.Item:
                return this.items.find(opts);
            case ContentType.Monster:
                return this.monsters.find(opts);
            case ContentType.NPC:
                return this.npcs.find(opts);
        }
    }

    filter(type: ContentType, opts: any) {
        switch (type) {
            case ContentType.Item:
                return this.items.filter(opts);
            case ContentType.Monster:
                return this.monsters.filter(opts);
            case ContentType.NPC:
                return this.npcs.filter(opts);
        }
    }
}
