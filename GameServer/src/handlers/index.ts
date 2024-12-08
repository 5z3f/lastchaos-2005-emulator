
import messages from './_messages.json';

import MSG_ATTACK from './MSG_ATTACK';
import MSG_CHAT from './MSG_CHAT';
import MSG_EXTEND from './MSG_EXTEND';
import MSG_FRIEND from './MSG_FRIEND';
import MSG_GM from './MSG_GM';
import MSG_ITEM from './MSG_ITEM';
import MSG_LOGIN from './MSG_LOGIN';
import MSG_MENU from './MSG_MENU';
import MSG_MOVE from './MSG_MOVE';
import MSG_PULSE from './MSG_PULSE';
import MSG_QUEST from './MSG_QUEST';
import MSG_QUICKSLOT from './MSG_QUICKSLOT';
import MSG_SKILL from './MSG_SKILL';
import MSG_START_GAME from './MSG_START_GAME';
import MSG_STATPOINT from './MSG_STATPOINT';

const handlers = {
    [messages.MSG_LOGIN]: MSG_LOGIN,
    [messages.MSG_MENU]: MSG_MENU,
    [messages.MSG_START_GAME]: MSG_START_GAME,
    [messages.MSG_MOVE]: MSG_MOVE,
    [messages.MSG_ATTACK]: MSG_ATTACK,
    [messages.MSG_CHAT]: MSG_CHAT,
    [messages.MSG_ITEM]: MSG_ITEM,
    [messages.MSG_GM]: MSG_GM,
    [messages.MSG_QUEST]: MSG_QUEST,
    [messages.MSG_STATPOINT]: MSG_STATPOINT,
    [messages.MSG_PULSE]: MSG_PULSE,
    [messages.MSG_FRIEND]: MSG_FRIEND,
    [messages.MSG_EXTEND]: MSG_EXTEND,
    [messages.MSG_QUICKSLOT]: MSG_QUICKSLOT,
    [messages.MSG_SKILL]: MSG_SKILL,
};

export default handlers;
