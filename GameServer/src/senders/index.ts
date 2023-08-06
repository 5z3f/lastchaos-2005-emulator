
import session from '@local/shared/session';
import appear from './appear';
import attack from './attack';
import at from './at';
import autoattack from './autoattack';
import chat from './chat';
import custom from './custom';
import damage from './damage';
import db from './db';
import disappear from './disappear';
import effect from './effect';
import env from './env';
import extend from './extend';
import fail from './fail';
import friend from './friend';
import gm from './gm';
import inventory from './inventory';
import item from './item';
import move from './move';
import objectstatus from './objectstatus';
import pulse from './pulse';
import quest from './quest';
import statpoint from './statpoint';
import status from './status';
import sys from './sys';


export default (session: session) => {
    const send = {
        appear: appear(session),
        at: at(session),
        attack: attack(session),
        autoattack: autoattack(session),
        chat: chat(session),
        custom: custom(session),
        damage: damage(session),
        db: db(session),
        disappear: disappear(session),
        effect: effect(session),
        env: env(session),
        extend: extend(session),
        fail: fail(session),
        friend: friend(session),
        gm: gm(session),
        inventory: inventory(session),
        item: item(session),
        move: move(session),
        objectstatus: objectstatus(session),
        pulse: pulse(session),
        quest: quest(session),
        statpoint: statpoint(session),
        status: status(session),
        sys: sys(session),
    };

    return send;
}
