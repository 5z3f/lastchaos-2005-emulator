
import Session from '@local/shared/session';

import appear from './appear';
import assist from './assist';
import at from './at';
import attack from './attack';
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
import quickslot from './quickslot';
import skill from './skill';
import statpoint from './statpoint';
import status from './status';
import sys from './sys';

export type SendersType = {
    appear: ReturnType<typeof appear>,
    attack: ReturnType<typeof attack>,
    at: ReturnType<typeof at>,
    autoattack: ReturnType<typeof autoattack>,
    chat: ReturnType<typeof chat>,
    custom: ReturnType<typeof custom>,
    damage: ReturnType<typeof damage>,
    db: ReturnType<typeof db>,
    disappear: ReturnType<typeof disappear>,
    effect: ReturnType<typeof effect>,
    env: ReturnType<typeof env>,
    extend: ReturnType<typeof extend>,
    fail: ReturnType<typeof fail>,
    friend: ReturnType<typeof friend>,
    gm: ReturnType<typeof gm>,
    inventory: ReturnType<typeof inventory>,
    item: ReturnType<typeof item>,
    move: ReturnType<typeof move>,
    objectstatus: ReturnType<typeof objectstatus>,
    pulse: ReturnType<typeof pulse>,
    quest: ReturnType<typeof quest>,
    statpoint: ReturnType<typeof statpoint>,
    status: ReturnType<typeof status>,
    sys: ReturnType<typeof sys>,
    skill: ReturnType<typeof skill>,
    quickslot: ReturnType<typeof quickslot>,
    assist: ReturnType<typeof assist>,
};

export function sendersFunction(session: Session<SendersType>) {
    return {
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
        skill: skill(session),
        quickslot: quickslot(session),
        assist: assist(session),
    };
}

export default sendersFunction;
