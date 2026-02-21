/**
 * Owlin Tracker - Entry Point
 * Exports the tracker and its components
 */

export { OwlinTracker, init, getTracker, destroy } from './tracker.js';
export { EventSender, getSender, resetSender } from './utils/sender.js';
export { ClickCollector } from './collectors/click.js';
export { InputCollector } from './collectors/input.js';
export { NavigationCollector } from './collectors/navigation.js';
export { ApiCollector } from './collectors/api.js';
export { ErrorCollector } from './collectors/error.js';
export * from './utils/dom.js';
