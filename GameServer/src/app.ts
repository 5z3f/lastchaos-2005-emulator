import db from '@local/shared/db';
import { Pool } from 'mariadb';
import config from '../../servers.config.json';
import game from './game';

export default class App {
    static config = config; // FIXME: type this properly
    static dbc: Pool;
    static game: typeof game;

    static initialize() {
        this.dbc = db.initialize();
        this.game = game.initialize();
    }
}
