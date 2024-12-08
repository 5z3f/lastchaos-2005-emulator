
import EventEmitter from 'events';
import server from "@local/shared/server";
import log from '@local/shared/logger';
import Message from "@local/shared/message";

//import state from "./state";

class stages {
    LOGIN = 0;
    CHARACTER_SELECT = 1;
    PLAYING = 2;
}
