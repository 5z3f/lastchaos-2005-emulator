import Message from '@local/shared/message';
import Session from '@local/shared/session';
import { SendersType } from '.';

export default function (session: Session<SendersType>) {
    // TODO:
    return () => {
        // 0x23, 0x1, 0x0, 0x0, 0x0, 0x14
        // 0x23, 0x1, 0x0, 0x0, 0x0, 0x4e
        const msg = new Message({ buffer: Buffer.from('23010000004e', 'hex'), header: false });
        session.write(msg.build());

        // 0x23, 0x2, 0x0, 0x0, 0x0, 0x3, 0x0, 0x0, 0x0, 0xf, 0x0, 0x0, 0x0, 0x0, 0x10, 0x0, 0x0, 0x0, 0x0, 0x30, 0x0
        const msg2 = new Message({ buffer: Buffer.from('2302000000030000000f0000000010000000003000', 'hex'), header: false });
        session.write(msg2.build());
    }
}
