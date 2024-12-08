import Message from '@local/shared/message';
import Session from '@local/shared/session';
import database from '../database';

import { SendersType } from '../senders';
import { StatpointType } from '../system/core/statpoints';

export default function (session: Session<SendersType>, msg: Message) {
    const subType = msg.read('u8');
    const subTypeMap = {
        1: 'MSG_STATPOINT_USE',
        3: 'MSG_STATPOINT_RESET',
        // TODO: log other subtype packets as malformed
    };

    /*
        typedef enum _tagStatPointErrorType {
            MSG_STATPOINT_ERROR_NOTENOUGH,		// Insufficient stat points
            MSG_STATPOINT_ERROR_CANTUSE,		// Stat points not available
            MSG_STATPOINT_ERROR_WRONGPACKET,	// Strange packets from the client
            MSG_STATPOINT_ERROR_NOMONEY,		// Requesting a reset with no money
        } MSG_STATPOINT_ERROR_TYPE;
    */

    const subTypeHandler = {
        MSG_STATPOINT_USE: async () => {
            const statpointType = msg.read('u8');
            const amount = 1;

            if (!(statpointType in StatpointType)) {
                // TODO: handle error
                return false;
            }

            const character = session.character!;
            if (character.statpoints.availablePoints < amount) {
                // TODO: handle error
                return false;
            }

            const statpointTypeKey = Object.keys(StatpointType).find(key => StatpointType[key] === statpointType) as string;
            const result = await database.characters.increaseStatistic(character.id, statpointTypeKey);

            if (result) {
                character.statpoints.add(statpointType, amount);
                character.statpoints.availablePoints -= amount;

                session.send.statpoint(1, {
                    type: statpointType,
                    value: amount,
                    remainingPoints: character.statpoints.availablePoints
                });

                character.updateStatistics();
            }
            else {
                session.send.fail(14); // MSG_FAIL_DB_UNKNOWN
                return;
            }
        },
        MSG_STATPOINT_RESET: () => {

        }
    }

    if (subTypeMap[subType] in subTypeHandler)
        subTypeHandler[subTypeMap[subType]]();
}
