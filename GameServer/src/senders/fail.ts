import Message from '@local/shared/message';
import Session from '@local/shared/session';
import { SendersType } from '.';
import _messages from './_messages.json';

export enum FailMessageType {
    // MANY_CONNECT,
    // WRONG_VERSION,
    // WRONG_CHAR,

    IncorrectCredentials = 3,

    // ALREADY_CONNECT,
    // CONNECT_SERVER,
    // BLOCK_CHAR,
    // CHECK_CHAR,
    // SYSTEM_ERROR,
    // NOT_EXIST_CHAR,

    NicknameAlreadyTaken = 10,

    // DB_NEW_CHAR,
    // DB_FULL_CHAR,

    CharacterDoesntExist = 13,
    DatabaseFailure = 14,

    // BILLING_NOT_PAY,
    // BILLING_NOT_RIGHT,
    // BILLING_TIME_OUT,
    // BILLING_ALREADY_CONNECT,
    // BILLING_OVER_IP,
    // BILLING_TIME_NOT_ENOUGH,
    // BILLING_TIME_OUT_DISCONNECT,
    // BILLING_OTHER,
    // BILLING_WRONGPW,
    // BILLING_BLOCKED,
    // MSGR_TIMEOUT_WHISPER,
    // MSGR_NOT_FOUND_CHAR,
    // LOGIN_SERVER,
    // LOGINSERV_MANY_CONNECT,
    // LOGINSERV_WRONG_VERSION,
    // LOGINSERV_WRONG_CHAR,
    // LOGINSERV_WRONG_PASSWORD,
    // LOGINSERV_ALREADY_CONNECT,
    // LOGINSERV_BLOCK_CHAR,
    // LOGINSERV_CHECK_CHAR,
    // LOGINSERV_SYSTEM_ERROR,
    // LOGINSERV_NOT_EXIST_CHAR,

    LoginUnavailable = 37, // shows "Maintenance" message box

    // WRONG_IDENTIFICATION,
    // TEST_WRONG,
    // NOT_IN_ZONE,
    // ENABLE_AREA,
    // CANNT_ENABLE_AREA,
    // LOGINSERV_NOT_ADULT,
    // NOTLEVEL_FORDELETE,
    // DB_DELETE_DELAY_CHAR,
    // SCARD_NOT_MATCHING,
    // LOGINSERV_BLOCK_USER,
    // TIME_OUT,
}

export default function (session: Session<SendersType>) {
    return (subType: FailMessageType) => {
        const msg = new Message({ type: _messages.MSG_FAIL, subType })
        session.write(msg.build());
    }
}
