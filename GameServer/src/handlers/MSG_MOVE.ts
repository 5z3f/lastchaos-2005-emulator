import Message from '@local/shared/message';
import Session from '@local/shared/session';

import { SendersType } from '../senders';
import { Position } from '../types';

// TODO: rework the whole movement system, add server side movement simulation also get MSG_STOP_MOVE working for skills

export default function (session: Session<SendersType>, msg: Message) {
    const data = {
        objType: msg.read('u8'),
        moveType: msg.read('u8'), // 03
        uid: msg.read('u32>'), // 50 b9 08 24
        speed: msg.read('f<'), // 00 00 00 00
        x: msg.read('f<'), // 7a 6c 8d 44
        y: msg.read('f<'), // c8 64 75 44
        z: msg.read('f<'), // 6a 5d 20 43
        r: msg.read('f<'), // 8e bf 2a c3 
        layer: msg.read('u8'), // 8e
    };

    const moveTypeMap = {
        0: 'MSG_MOVE_WALK',
        1: 'MSG_MOVE_RUN',
        2: 'MSG_MOVE_PLACE',
        3: 'MSG_MOVE_STOP',
    };

    const character = session.character!;

    if (character.uid != data.uid) {
        // TODO: sorcerer summoners
        // else cheating ?
        return;
    }

    const newPosition = new Position(
        parseFloat(data.x.toFixed(1)),
        parseFloat(data.y.toFixed(1)),
        parseFloat(data.z.toFixed(1)),
        parseFloat(data.r.toFixed(1)),
        data.layer
    );

    const subTypeHandler = {
        MSG_MOVE_WALK: () => {
            //log.data(`[MOVE WALK] uid: ${ data.uid } [from: (${ character.position.x }, ${ character.position.y }) to (${ newPosition.x }, ${ newPosition.y })]`)
        },
        MSG_MOVE_RUN: () => {
            // @ts-ignore
            // data.position = {
            //     x: data.x,
            //     y: data.y,
            //     z: data.z,
            //     r: data.r,
            //     layer: data.layer
            // };
            // 
            // // @ts-ignore
            // session.send.move(data)
            //log.data(`[MOVE RUN] uid: ${ data.uid } [from: (${ character.position.x }, ${ character.position.y }) to (${ newPosition.x }, ${ newPosition.y })]`)
        },
        MSG_MOVE_PLACE: () => {
            //log.data(`[MOVE PLACE] uid: ${ data.uid } [from: (${ character.position.x }, ${ character.position.y }) to (${ newPosition.x }, ${ newPosition.y })]`)
        },
        MSG_MOVE_STOP: () => {
            //console.log(`[MOVE STOP BUFFER] ${msg.toString()}`)
            // this buffer is sent when using skill while moving
            // [MOVE STOP BUFFER] 8101b8010000166e0000001c8c00035ecf48f6000000006d4c8c445711704435bf2043bb2401c3008101b9010000166e000000279b02005ecf48f6000000a3005ecf48f60000000000000000000000000000000000000000000000
        },
    };

    //console.log(data)

    session.send.move({
        objType: data.objType,
        moveType: data.moveType,
        uid: data.uid,
        speed: 0.0,
        position: {
            x: character.position.x,
            y: character.position.y,
            z: character.position.z,
            r: character.position.r,
            layer: character.position.layer,
        },
        attribute: 0,
    })

    if (moveTypeMap[data.moveType] in subTypeHandler)
        subTypeHandler[moveTypeMap[data.moveType]]();

    // FIXME: This approach is wrong, server side movement simulation is needed
    character.updatePosition(newPosition);
}
