import log from '@local/shared/logger';
import Session from '@local/shared/session';
import net from 'net';

type serverOptions<T> = {
    host?: string,
    port?: number,
    handlers: any,
    senders: T,
    world?: any,
};

export default class Server<T> {
    host: string;
    port: number;
    sessions: Session<T>[];

    //static World = null;
    constructor({ host, port, handlers, senders }: serverOptions<T>) {
        const that = this;

        this.host = host || '127.0.0.1';
        this.port = port || 4190;

        // hold current sessions
        this.sessions = [];

        const srv = net.createServer();

        srv.on('connection', (socket) => {
            const session = new Session<T>({
                server: that,
                socket: socket,
                handlers: handlers,
                senders: senders
            });

            this.sessions.push(session);
        });

        srv.listen(this.port, this.host, () => {
            log.info(`Server started listening on ${this.host}:${this.port}`)
        });
    }

    // remove existing session
    session = {
        remove: (uid: number) => { delete this.sessions[uid]; },
        //find: (cb: (element: session, index: number, array: session[]) => session, thisArg?: any) => this.sessions.find(cb)
    }
}
