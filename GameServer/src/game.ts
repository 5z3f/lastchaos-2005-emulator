import Content from "./content";
import { Position } from "./types";
import World from "./world";
import Zone from "./zone";

import Invite from "./system/core/invite";

export default class Game {
    static encryption = false; // TODO: move this
    static packDefault = true; // TODO: move this

    static content: Content;
    static world: World;

    // systems
    static invites: Invite[] = [];

    static initialize() {
        this.content = new Content();
        this.world = new World();

        return this;
    }

    static sendInArea(zone: Zone, position: Position, msgType: any, msgData: any) {
        //@ts-ignore
        const objectPoints = zone.getObjectsInArea(position.x, position.y, 250).filter((o) => o.character);

        for (let i = 0; i < objectPoints.length; i++) {
            const obj = objectPoints[i];
            //@ts-ignore
            obj.character.session.send[msgType](msgData);
        }

        //let characters = this.world.filter(GameObjectType.Character, (ch: Character) => ch.zone.id === zone.id && ch.distance(position) < 250);
        //
        //for (let ch of characters) {
        //    ch.session.send[msgType](msgData);
        //}
    }
}
