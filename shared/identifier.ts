//import crypto from 'crypto';
//import { XXHash32 } from 'xxhash-addon';
//
//export default class identifier {
//    static create() {
//        const seed = crypto.randomBytes(4);
//        const hash = XXHash32.hash(crypto.randomBytes(4))//, seed);
//        const hashInt = hash.readUIntBE(0, 4) & 0xFFFFFFFF;
//
//        return [hashInt, this.convert(hashInt)]
//    }
//
//    static retrieve(hex: string) {
//        // Convert the hex string to its decimal representation
//        const decimal = parseInt(hex, 16);
//
//        // Convert the decimal value to its negative unsigned integer representation
//        const unsignedInt = decimal >>> 0;
//
//        return -unsignedInt;
//    }
//
//    static convert(unsignedInt: number) {
//        // Convert the unsigned integer to its hex representation
//        let hex = (unsignedInt >>> 0).toString(16);
//
//        // Remove any negative sign that may appear
//        if (hex.charAt(0) === '-')
//            hex = hex.substring(1);
//
//        return hex;
//    }
//}
//