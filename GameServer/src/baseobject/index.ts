
// TODO: move this?
const MonsterFlags = {
    SHOPPER: (1 << 0),	// store owner
    AGGRESSIVE: (1 << 1),	//
    ATTACK: (1 << 2),	// can attack
    MOVING: (1 << 3),	// moveable
    PEACEFUL: (1 << 4),	//
    ZONEMOVER: (1 << 5),	// teleporter
    CASTLE_GUARD: (1 << 6),	// castle guard
    REFINER: (1 << 7),	//
    QUEST: (1 << 8),	//
    CASTLE_TOWER: (1 << 9),	//
    MINERAL: (1 << 10),	//
    CROPS: (1 << 11),	//
    ENERGY: (1 << 12),	//
    ETERNAL: (1 << 13),	//
    LORD_SYMBOL: (1 << 14),	//
    REMISSION: (1 << 15),	//
    EVENT: (1 << 16),	//
    GUARD: (1 << 17),	//
    KEEPER: (1 << 18),	// storage
    GUILD: (1 << 19),	//
    MBOSS: (1 << 20),	// mini boss
    BOSS: (1 << 21),	//
    RESETSTAT: (1 << 22),	//
    CHANGEWEAPON: (1 << 23),	// weapon replacement
    WARCASTLE: (1 << 24),	// siege
    DISPLAY_MAP: (1 << 25),	// visible on the map
    QUEST_COLLECT: (1 << 26),	// for collection quests
    PARTY: (1 << 27)	// in group
};

// TODO: move this?
const ItemFlags = {
    COUNT: (1 << 0),
    DROP: (1 << 1),
    UPGRADE: (1 << 2),
    EXCHANGE: (1 << 3),
    TRADE: (1 << 4),
    DESTRUCTIBLE: (1 << 5),
    PRODUCE: (1 << 6),
    MIX: (1 << 7),
    CASHITEM: (1 << 8),
    LORD: (1 << 9),
    UNSTORABLE: (1 << 10),
    CHANGE: (1 << 11),
    COMPOSITE: (1 << 12),
    CASHMOON: (1 << 13),
    LENT: (1 << 14),
    RARE: (1 << 15)
};

type BaseObjectOptions = {
    id: number;
    enabled: boolean;

    name: string;
    description: string;

    level: number;
    flags: string[];
};

export default class BaseObject {

    id: number;
    enabled: boolean;

    name: string;
    description: string;

    level: number;
    flags: string[];

    constructor({ id, enabled, name, description, level, flags }: BaseObjectOptions) {
        this.id = id;
        this.enabled = !!enabled;

        this.name = name;
        this.description = description;

        this.level = level;
        this.flags = flags;
    }

}
