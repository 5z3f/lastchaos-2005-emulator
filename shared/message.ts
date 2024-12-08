
import lccrypt from '@local/shared/lccrypt';
import { SmartBuffer } from 'smart-buffer';
//import game from '../GameServer/src/game'; // TODO: move this

const game = {
    packDefault: true,
    encryption: false,
};

type DataTypeToReturnType<T> =
    T extends 'stringnt' ? string :
    T extends 'i8' | 'u8' | 'i16<' | 'i16>' | 'u16<' | 'u16>' | 'i32<' | 'i32>' | 'u32<' | 'u32>' | 'f<' | 'f>' ? number :
    T extends 'i64<' | 'i64>' | 'u64<' | 'u64>' ? bigint :
    never;

type dataTypes = 'i8' | 'u8' | 'i16<' | 'i16>' | 'u16<' | 'u16>' | 'i32<' | 'i32>' | 'u32<' | 'u32>' | 'i64<' | 'i64>' | 'u64<' | 'u64>' | 'f<' | 'f>' | 'stringnt';

type MessageOptions = {
    buffer?: Buffer, // initialize from given `Buffer` object
    type?: number, // write message type
    subType?: number, // write message subtype
    header?: boolean, // read lc packet header?
    encrypted?: boolean, // is packet encrypted?
};

export default class Message {
    _sb;
    header;
    encrypted;

    constructor({ buffer, type, subType, header = true, encrypted = true }: MessageOptions) {
        if (buffer && type)
            buffer.writeUInt8(buffer.readUInt8(0) | 0x80, 0);

        this._sb = buffer
            ? SmartBuffer.fromBuffer(buffer)
            : new SmartBuffer();

        this.encrypted = encrypted;

        this.header = (header !== false && this._sb.length > 12) ? {    // 12 - header length
            reliable: this.read('u16>'),                              // ntohs
            sequence: this.read('u32>'),                              // ntohl
            packetId: this.read('u16>'),
            packetSize: this.read('u32>'),
        } : null;

        if (buffer && this.encrypted && game.encryption) {
            const decrypted = Message.decrypt(buffer.slice(12));          // TODO: implement error handler
            this._sb = SmartBuffer.fromBuffer(decrypted);
        }

        if (type || type === 0) this.write('u8', game.packDefault ? type | 0x80 : type);
        if (subType || subType === 0) this.write('u8', subType);
    }

    /**
     * Decrypt buffer using LCCrypt library
     */
    static decrypt = (buffer: Buffer): Buffer => lccrypt.decrypt(buffer);

    /**
     * Encrypt buffer using LCCrypt library
     */
    static encrypt = (buffer: Buffer): Buffer => lccrypt.encrypt(buffer);

    /**
     * Get Buffer object
     */
    buffer = (): Buffer => this._sb.toBuffer();

    /**
     * Get string buffer
     */
    toString = (): string => this.buffer().toString('hex');

    /**
     * Build message and export it to `Buffer` object
     */
    build(header = true, encrypt = true): Buffer {
        const makeHeader = (messageSize: number) => {
            const writer = new SmartBuffer();

            writer.writeUInt16BE((1 << 0) | (1 << 7) | (1 << 8));                       // reliable
            writer.writeUInt32BE(0);                                                    // sequence
            writer.writeUInt16BE(0);                                                    // packet id
            writer.writeUInt32BE(encrypt !== false && game.encryption ? (messageSize + 5) : messageSize);  // message size + lccrypt sum  || FIXME: write it smarter

            return writer;
        };

        return header === false
            ? this._sb.toBuffer()
            : Buffer.concat([makeHeader(this._sb.length).toBuffer(), encrypt !== false && game.encryption ? Message.encrypt(this._sb.toBuffer()) : this._sb.toBuffer()]);
    }

    read<T extends dataTypes>(type: T): DataTypeToReturnType<T> {
        let val;

        const isLittleEndian = type.endsWith('<');
        const isBigEndian = type.endsWith('>');
        const baseType = (isLittleEndian || isBigEndian) ? type.slice(0, -1) : type; // remove the last character if it's '<' or '>'

        const typeToMethod = {
            'i8': this._sb.readInt8,
            'u8': this._sb.readUInt8,
            'stringnt': this._sb.readStringNT,
            'i16': isLittleEndian ? this._sb.readInt16LE : this._sb.readInt16BE,
            'u16': isLittleEndian ? this._sb.readUInt16LE : this._sb.readUInt16BE,
            'i32': isLittleEndian ? this._sb.readInt32LE : this._sb.readInt32BE,
            'u32': isLittleEndian ? this._sb.readUInt32LE : this._sb.readUInt32BE,
            'i64': isLittleEndian ? this._sb.readBigInt64LE : this._sb.readBigInt64BE,
            'u64': isLittleEndian ? this._sb.readBigUInt64LE : this._sb.readBigUInt64BE,
            'f': isLittleEndian ? this._sb.readFloatLE : this._sb.readFloatBE,
        };

        const method = typeToMethod[baseType as keyof typeof typeToMethod] as any;
        if (!method)
            throw new Error(`Unsupported type: ${baseType}`);

        return method.call(this._sb);
    }

    write(type: dataTypes, val: any) {
        switch (type) {
            case 'i8': this._sb.writeInt8(val); break;
            case 'u8': this._sb.writeUInt8(val); break;
            case 'stringnt': this._sb.writeStringNT(val); break;
            case 'i16<': this._sb.writeInt16LE(val); break;
            case 'i16>': this._sb.writeInt16BE(val); break;
            case 'u16<': this._sb.writeUInt16LE(val); break;
            case 'u16>': this._sb.writeUInt16BE(val); break;
            case 'i32<': this._sb.writeInt32LE(val); break;
            case 'i32>': this._sb.writeInt32BE(val); break;
            case 'u32<': this._sb.writeUInt32LE(val); break;
            case 'u32>': this._sb.writeUInt32BE(val); break;
            case 'i64<': this._sb.writeBigInt64LE(BigInt(val)); break;
            case 'i64>': this._sb.writeBigInt64BE(BigInt(val)); break;
            case 'u64<': this._sb.writeBigUInt64LE(BigInt(val)); break;
            case 'u64>': this._sb.writeBigUInt64BE(BigInt(val)); break;
            case 'f<': this._sb.writeFloatLE(val); break;
            case 'f>': this._sb.writeFloatBE(val); break;
        }
    }
};
