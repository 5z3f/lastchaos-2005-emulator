
import BaseObject from './index';

type ItemOptions = {
    id: number,
    name: string,
    description: string,
    enabled: boolean,
    type: number,
    subType: number,
    flags: number,
    jobFlag: number,
    wearingPosition: number,
    level: number,
    weight: number,
    price: number,
    durability: number,
    values: number[],
};

export default class BaseItem extends BaseObject {

    type: number;
    subType: number;

    jobFlag: number;

    wearingPosition: number;

    weight: number;
    price: number;
    durability: number;
    values: number[];

    constructor({ id, name, description, enabled, type, subType, flags, jobFlag, wearingPosition, level, weight, price, durability, values }: ItemOptions) {

        //@ts-ignore
        super(...arguments);

        this.type = type;
        this.subType = subType;

        this.jobFlag = jobFlag;

        this.wearingPosition = wearingPosition;
        this.level = level;
        this.weight = weight;
        this.price = price;
        this.durability = durability;
        this.values = values || [0, 0, 0, 0, 0];
    }

}
