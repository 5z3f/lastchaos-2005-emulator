import { Vector2 } from 'three';

export type PositionProps = {
    x: number,
    y: number,
    z: number,
    r: number,
    layer: number,
};

type PositionOptions = {
    x: number,
    y: number,
    z?: number,
    r?: number,
    layer?: number,
};

export default class Position extends Vector2 {

    static from({ x, y, z = 0, r = 0, layer = 0 }: PositionOptions) {
        return new Position(x, y, z, r, layer);
    }

    z: number;
    r: number;
    layer: number;

    constructor(x: number, y: number, z = 0, r = 0, layer = 0) {
        super(x, y);

        this.z = z || 0.0;
        this.r = r || 0.0;
        this.layer = layer || 0;
    }

    //@ts-ignore
    clone() {
        return Position.from(this);
    }

    /**
     * Returns an array of the position values
     * @returns [x, y, z, r, layer]
     */
    //@ts-ignore
    toArray() {
        return [this.x, this.y, this.z, this.r, this.layer]
    }

    static setRandomWithinRange(originalPosition: Position, range: number) {
        const randomOffset = new Vector2().random().subScalar(0.5).multiplyScalar(range);
        return Position.from(originalPosition).add(randomOffset);
    }

    static getRandomWithinRange(originalPosition: Position, range: number) {
        return Position.from(originalPosition).setRandomWithinRange(range);
    }

    setRandomWithinRange(range: number) {
        const constructor = this.constructor as typeof Position;
        return constructor.setRandomWithinRange(this, range);
    }

    getRandomWithinRange(range: number) {
        const constructor = this.constructor as typeof Position;
        return constructor.getRandomWithinRange(this, range);
    }

    toString() {
        return `${this.x}, ${this.y}, ${this.z}, ${this.r}, ${this.layer}`;
    }
}
