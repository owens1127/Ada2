const config = require('../config.json');
const fs = require('node:fs');

/**
 *
 * @param {Map} map
 * @return {{}}
 */
exports.mapToObject = (map) => {
    return Array.from(map).reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
    }, {});
}

exports.timeKey = (delta) => {
    const utcTime = (delta + 24 + config.UTCResetHour) % 24;
    return Math.floor(utcTime) + ':' + Math.round(utcTime % 1 * 60)
}