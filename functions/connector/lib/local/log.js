"use strict"

/**
 * Simple wrapper around the console for logging various kinds of information
 */
export function trace(msg) {
    console.log("TRACE - " + msg);
}
export function debug(msg) {
    console.log("DEBUG - " + msg);
}
export function info(msg) {
    console.log("INFO  - " + msg);
}
export function warn(msg) {
    console.log("WARN  - " + msg);
}
export function error(msg) {
    console.log("ERROR - " + msg);
}
export function response(callback, data) {
    console.log(`RESPONSE: ${JSON.stringify(data, null, 2)}`);
    callback(null, data);
}