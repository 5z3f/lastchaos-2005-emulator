import log from "@local/shared/logger";
import Message from '@local/shared/message';
import net from 'net';
import Character from '../GameServer/src/gameobject/character';
import { createSessionId } from "../GameServer/src/util";
import Server from './server';

const game = {
    packDefault: true,
};

type sessionOptions<T> = {
    server: Server<T>,
    socket: net.Socket,
    handlers: any,
    senders: any,
};

/**
 * Represents a session between a client and the server.
 */
export default class Session<T> {
    server: Server<T>;
    socket: net.Socket;

    // unique id
    uid: number;

    // pinned character
    character?: Character;

    // database user account id
    accountId?: number;

    handlers: any;
    send: T;

    constructor({ server, socket, handlers, senders }: sessionOptions<T>) {
        this.server = server;
        this.socket = socket;

        this.uid = createSessionId();

        // TODO: type this
        this.handlers = handlers;
        this.send = senders(this);

        log.info(`New session: ${this.toString()}`);

        const listen = () => {
            const that = this;

            this.socket.on('data', (data) => {
                const msg = new Message({ buffer: data });
                let id = msg.read('u8');

                if (game.packDefault)
                    id = id & 0x3f;

                // TODO: restrict access to all packets except '0x03' if client is not logged in
                const handler = that.handlers[id];

                if (!handler) {
                    log.info(`Received unknown message: ${id}`);
                    log.info(`Buffer: ${msg.toString()}`)
                    return;
                }

                handler(that, msg);
            });

            this.socket.on('error', (err) => {
                // TODO: handle this
                log.error(`Session error: ${err}`);
                this.close();
            });

            this.socket.on('close', () => {
                this.unpinCharacter();
                this.unpinAccount();

                // remove session
                this.server.session.remove(this.uid);

                log.info(`Session disconnected: ${that.toString()}`);
            })
        }

        listen();
    }

    /**
     * Writes data to the socket.
     * @param buffer - The data to be written, either as a string or Uint8Array.
     */
    write(buffer: string | Uint8Array | Buffer) {
        if (buffer instanceof Buffer)
            buffer = new Uint8Array(buffer);

        this.socket.write(buffer);
    }

    /**
     * Closes the session by destroying the socket connection and removing the session from the server.
     */
    close() {
        this.socket.destroy();
        this.server.session.remove(this.uid);
    }

    /**
     * Returns a string representation of the Session object.
     * The string includes the unique identifier (uid) and the remote address and port of the socket.
     * @returns A string representation of the Session object.
     */
    toString() {
        return `uid: ${this.uid}, address: ${this.socket.remoteAddress}:${this.socket.remotePort}`;
    }

    /**
     * Pins the specified account to the session.
     * @param character The character to pin.
     */
    pinAccount(accountId: number) {
        this.accountId = accountId;
    }

    /**
     * Unpins the account from the session.
     */
    unpinAccount() {
        this.accountId = undefined;
    }

    /**
     * Pins the specified character to the session.
     * @param character The character to pin.
     */
    pinCharacter(character: Character) {
        this.character = character;
    }

    /**
     * Unpins the character from the session.
     */
    unpinCharacter() {
        if (!this.character)
            return;

        this.character.dispose();
        this.character = undefined;
    }

    /**
     * Checks if the player is currently in the game.
     * @returns {boolean} True if the player is in the game, false otherwise.
     */
    inGame(): boolean {
        return this.character !== undefined;
    }
}
