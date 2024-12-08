
import Server from '@local/shared/server';
import app from './app';
import handlers from './handlers';
import senders, { SendersType } from './senders';

app.initialize();

// register app as global for REPL
global.app = app;

const srv = new Server<SendersType>({
    host: app.config.gameserver.host,
    port: app.config.gameserver.port,
    handlers,
    senders: senders as unknown as SendersType,
});
