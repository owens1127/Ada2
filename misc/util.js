const config = require('../config.json');
const fs = require('node:fs');

/**
 *
 * @param {Map} map
 * @return {{}}
 */
exports.asyncMapToObject = async (map) => {
    return Array.from(map).reduce(async (obj, [key, value]) => {
        obj[key] = await value;
        return obj;
    }, {});
}

exports.timeKey = (delta) => {
    const utcTime = (delta + 24 + config.UTCResetHour) % 24;
    return Math.floor(utcTime) + ':' + Math.round(utcTime % 1 * 60)
}

/** @return {Date} */
exports.nextReset = () => {
    const reset = new Date();
    // make sure we have the right "day"
    reset.setUTCHours(reset.getUTCHours() - config.UTCResetHour);
    reset.setUTCHours(config.UTCResetHour, 0, 0, 0);
    reset.setUTCDate(reset.getUTCDate() + 1);
    return reset;
}

exports.round = (n, d) => {
    const tens = Math.pow(10, d);
    return Math.round(tens * n) / tens;
}

/**
 * 
 * @param {any[]} iterable 
 * @param {function} f 
 * @returns 
 */
exports.andmap = (iterable, f) => {
    let foo = true;
    for (n in iterable) {
        if (!f(n)) {
            foo = false;
            break;
        }
    }
    return foo;
}