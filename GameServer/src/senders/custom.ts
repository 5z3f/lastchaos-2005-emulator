import Message from '@local/shared/message';
import type Session from '@local/shared/session';
import type { SendersType } from '.';


export default function (session: Session<SendersType>) {
    return (byteString: string, packType: number) => {
        if (byteString.includes('0x'))
            byteString = byteString.replace(/0x/g, '').split(', ').map((strByte) => (strByte.length === 1) ? `0${strByte}` : strByte).join('');


        if (byteString.includes('test')) {
            const msg = new Message({ type: 43 });
            msg.write('u8', 45);
            msg.write('i32>', 7);
            msg.write('i32>', 1589247999);
            msg.write('stringnt', 'testttt');

            session.write(msg.build());
            return `CUSTOM PACKET SENT [BUFFER: ${msg.toString()}]`
        }

        const msg = new Message({ buffer: Buffer.from(byteString, 'hex'), type: Number(!!packType) });
        session.write(msg.build());

        return `CUSTOM PACKET SENT [BUFFER: ${msg.toString()}]`
    }
}
