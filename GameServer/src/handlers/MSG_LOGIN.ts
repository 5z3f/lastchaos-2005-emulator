import log from '@local/shared/logger';
import Session from '@local/shared/session';
import database from '../database';
import { SendersType } from '../senders';
import { DBMessageType } from '../senders/db';
import { FailMessageType } from '../senders/fail';

export default async function (session: Session<SendersType>, msg: any) {
    const data = {
        version: msg.read('u32>'),
        mode: msg.read('u8'),
        username: msg.read('stringnt'),
        password: msg.read('stringnt'),
        nation: msg.read('u8')
    };

    // TODO: check client version and if its wrong send fail message: MSG_FAIL_WRONG_VERSION

    // will return null if account doesn't exist or password is incorrect
    const dbAccount = await database.accounts.getByCredentials(data.username, data.password);

    if (!dbAccount) {
        session.send.fail(FailMessageType.IncorrectCredentials);
        log.data(`[IN]  >> client failed login request: [ver: ${data.version}, username: ${data.username}, password: ${data.password}, nation: ${data.nation}`);
        return;
    }

    // pair session with user account
    session.pinAccount(dbAccount.id);

    log.data(`[IN]  >> client login request: [ver: ${data.version}, username: ${data.username}, password: ${data.password}, nation: ${data.nation}]`);

    const accountId = session.accountId!;
    const dbCharacters = await database.accounts.getCharacters(accountId);

    if (!dbCharacters) {
        //session.send.fail( ); // TODO: 
        return;
    }

    for (let dbCharacter of dbCharacters) {
        const wearingItems = await database.characters.getWearingItems(dbCharacter.id);

        if (!wearingItems) {
            session.send.fail(FailMessageType.DatabaseFailure);
            return;
        }

        session.send.db({
            subType: DBMessageType.CharacterExist,
            // @ts-ignore
            dbCharacter, wearingItems
        })
    }

    session.send.db({
        subType: DBMessageType.CharacterExistEnd,
    });
}
