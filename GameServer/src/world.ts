
import { GameObjectType } from './gameobject';
import Zone from './zone';

export enum ZoneType {
    Juno = 0,
}

export default class World {
    zones: Zone[] = [];

    constructor() {
        // add juno
        this.zones.push(new Zone(0, 1536, 1536));
    }

    getZone(zoneType: ZoneType) {
        return this.zones.find(zone => zone.id === zoneType);
    }

    add(type: GameObjectType | 'zone', zoneType: ZoneType, data: any) {
        if (type === 'zone') {
            this.zones.push(data);
            return true;
        }

        if (!(type in GameObjectType) || !(zoneType in ZoneType))
            return false;

        // add to zone
        const zone = this.getZone(zoneType);

        if (!zone)
            return false;

        zone.add(type, data);
        return true;
    }

    filter(type: GameObjectType, opts: Function) {
        return this.zones.flatMap(zone => zone.filter(type, opts));
    }

    find(type: GameObjectType, opts: Function) {
        let result: any;

        for (let zone of this.zones) {
            result = zone.find(type, opts);

            if (result)
                break;
        }

        return result;
    }

    remove(type: GameObjectType, zoneType: ZoneType, opts: Function) {
        for (let zone of this.zones) {
            if (zone.id === zoneType)
                zone.remove(type, opts);
        }
    }
}
