import { EventEmitter as EE } from 'events';

/**
 * A wrapper class for events that extends EventEmitter.
 * @template T - The type of event.
 */
export default class EventEmitter<T extends string> extends EE {
    /**
     * Registers a callback function to be executed when the specified event is emitted.
     * @param event - The event to listen for.
     * @param callback - The callback function to be executed when the event is emitted.
     * @returns The instance of the EventWrapper class.
     */
    on(event: T, callback: (...args: any[]) => void) {
        super.on(event.toString(), callback);
        return this;
    }

    /**
     * Adds a one-time listener function for the specified event.
     * The listener will be invoked only once, then removed.
     *
     * @param event - The event to listen for.
     * @param callback - The listener function to be called when the event is triggered.
     * @returns The current instance of the event emitter.
     */
    once(event: T, callback: (...args: any[]) => void) {
        super.once(event.toString(), callback);
        return this;
    }

    /**
     * Emits the specified event with the provided arguments.
     * @param event - The event to emit.
     * @param args - The arguments to pass to the event listeners.
     * @returns A boolean indicating whether the event had listeners.
     */
    emit(event: T, ...args: any[]) {
        return super.emit(event.toString(), ...args);
    }
}
